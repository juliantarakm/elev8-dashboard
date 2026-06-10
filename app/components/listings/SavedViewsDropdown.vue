<script setup lang="ts">
import type { SavedView } from '~/types/saved-views'
import { Icon } from '#components'
import { formatDistanceToNow } from 'date-fns'
import { computed, ref } from 'vue'
import { Button } from '~/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Input } from '~/components/ui/input'
import { ScrollArea } from '~/components/ui/scroll-area'
import DeleteViewDialog from '~/components/listings/DeleteViewDialog.vue'
import RenameViewDialog from '~/components/listings/RenameViewDialog.vue'

const props = defineProps<{
  savedViews: SavedView[]
  activeView: SavedView | null
  isDirty: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  'load-view': [viewId: string]
  'save-as': []
  'update': []
  'delete': [viewId: string]
  'rename': [viewId: string, newName: string]
}>()

const viewSearch = ref('')
const deleteTarget = ref<SavedView | null>(null)
const renameTarget = ref<SavedView | null>(null)

const filteredViews = computed(() => {
  if (!viewSearch.value)
    return props.savedViews
  const q = viewSearch.value.toLowerCase()
  return props.savedViews.filter(v => v.name.toLowerCase().includes(q))
})

function getCreatorInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatTimeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}
</script>

<template>
  <div class="flex items-center gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="sm" class="h-9 gap-1.5 text-xs">
          <Icon name="lucide:bookmark" class="size-3.5" />
          {{ activeView ? `Saved Views: ${activeView.name}` : 'Saved Views' }}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent class="w-72" align="start">
        <DropdownMenuItem data-testid="save-as-option" @click="emit('save-as')">
          <Icon name="lucide:plus" class="mr-2 size-3.5" />
          Save current as...
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div v-if="savedViews.length > 0" class="p-2">
          <Input
            v-model="viewSearch"
            placeholder="Search views..."
            class="h-7 text-xs"
          />
        </div>

        <ScrollArea class="h-72">
          <div v-if="filteredViews.length === 0" class="px-2 py-4 text-sm text-muted-foreground text-center">
            {{ savedViews.length === 0 ? 'No saved views yet.' : 'No views found.' }}
          </div>

          <div v-else class="p-1 space-y-0.5">
            <DropdownMenuItem
              v-for="view in filteredViews"
              :key="view.id"
              class="group flex items-center justify-between py-2"
              :class="{ 'bg-muted': activeView?.id === view.id }"
              :data-testid="`view-item-${view.id}`"
              @click="emit('load-view', view.id)"
            >
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <Icon
                  v-if="activeView?.id === view.id"
                  name="lucide:check"
                  class="size-4 shrink-0 text-primary"
                />
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-sm truncate">
                    {{ view.name }}
                  </div>
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div class="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-medium">
                      {{ getCreatorInitials(view.createdBy) }}
                    </div>
                    <span>{{ formatTimeAgo(view.updatedAt) }}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="renameTarget = view"
              >
                <Icon name="lucide:edit-2" class="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                @click.stop="deleteTarget = view"
              >
                <Icon name="lucide:trash-2" class="size-3.5" />
              </Button>
            </DropdownMenuItem>
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>

    <Button
      v-if="activeView && isDirty"
      variant="outline"
      size="sm"
      class="h-9 gap-1.5 text-xs"
      :disabled="isLoading"
      @click="emit('update')"
    >
      <Icon name="lucide:refresh-cw" class="size-3.5" />
      Update {{ activeView.name }}
    </Button>

    <DeleteViewDialog
      v-if="deleteTarget"
      :open="!!deleteTarget"
      :view-name="deleteTarget.name"
      @update:open="deleteTarget = null"
      @delete="emit('delete', deleteTarget.id)"
    />

    <RenameViewDialog
      v-if="renameTarget"
      :open="!!renameTarget"
      :view-name="renameTarget.name"
      @update:open="renameTarget = null"
      @rename="emit('rename', renameTarget.id, $event)"
    />
  </div>
</template>
