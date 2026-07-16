<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import UsersTable from '~/components/users/UsersTable.vue'
import UserDetailSheet from '~/components/users/UserDetailSheet.vue'
import RolesGrid from '~/components/users/RolesGrid.vue'
import RoleDetailSheet from '~/components/users/RoleDetailSheet.vue'
import { useUsers } from '~/composables/useUsers'
import { useRoles } from '~/composables/useRoles'
import type { User } from '~/components/users/data/users'
import type { Role, RoleId } from '~/components/users/data/roles'

definePageMeta({
  layout: 'default',
})

const { totalCount, activeUsers, inactiveUsers } = useUsers()
const { roles } = useRoles()

// Sheet state
const userSheetOpen = ref(false)
const editingUserId = ref<string | undefined>(undefined)

const roleSheetOpen = ref(false)
const editingRoleId = ref<RoleId | undefined>(undefined)

function openAddUser() {
  editingUserId.value = undefined
  userSheetOpen.value = true
}

function openEditUser(user: User) {
  editingUserId.value = user.id
  userSheetOpen.value = true
}

function openEditRole(role: Role) {
  editingRoleId.value = role.id
  roleSheetOpen.value = true
}
</script>

<template>
  <ClientOnly>
    <div class="space-y-6 p-6">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-2xl font-bold tracking-tight">
            Users
          </h1>
          <p class="text-sm text-muted-foreground">
            Manage your team — create users, assign roles and listings.
          </p>
        </div>
        <Button @click="openAddUser">
          <Icon name="lucide:plus" class="mr-2 size-4" />
          Add user
        </Button>
      </div>

      <!-- KPI strip -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent class="p-4">
            <div class="text-xs text-muted-foreground uppercase tracking-wide">
              Total users
            </div>
            <div class="text-2xl font-bold mt-1">
              {{ totalCount }}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-xs text-muted-foreground uppercase tracking-wide">
              Active
            </div>
            <div class="text-2xl font-bold mt-1 text-green-600">
              {{ activeUsers.length }}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-xs text-muted-foreground uppercase tracking-wide">
              Inactive
            </div>
            <div class="text-2xl font-bold mt-1 text-muted-foreground">
              {{ inactiveUsers.length }}
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Tabs -->
      <Tabs default-value="users" class="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Icon name="lucide:users-round" class="mr-2 size-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Icon name="lucide:shield-check" class="mr-2 size-4" />
            Roles
            <Badge variant="secondary" class="ml-2">
              {{ roles.length }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" class="space-y-4">
          <UsersTable @edit="openEditUser" />
        </TabsContent>

        <TabsContent value="roles">
          <RolesGrid @edit="openEditRole" />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Sheets -->
    <UserDetailSheet
      v-model:open="userSheetOpen"
      :user-id="editingUserId"
    />
    <RoleDetailSheet
      v-model:open="roleSheetOpen"
      :role-id="editingRoleId"
    />

    <template #fallback>
      <div class="space-y-6 p-6">
        <Skeleton class="h-9 w-48" />
        <Skeleton class="h-4 w-72" />
        <Skeleton class="h-24 w-full" />
        <Skeleton class="h-64 w-full" />
      </div>
    </template>
  </ClientOnly>
</template>
