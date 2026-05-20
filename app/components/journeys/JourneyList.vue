<script setup lang="ts">
import type { Journey } from './data/journeys'
import { triggerMeta } from './data/journeys'

const emit = defineEmits<{
  'new-journey': []
  'open-marketplace': []
  'edit-journey': [journey: Journey]
}>()

const { journeys, toggleStatus, deleteJourney } = useJourneys()

function getTriggerLabel(t: string) {
  return triggerMeta[t]?.label ?? t
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  draft: { label: 'Draft', variant: 'outline' },
}
</script>

<template>
  <div class="flex flex-col h-full overflow-y-auto">
    <div class="flex items-start justify-between gap-4 border-b bg-background px-6 py-5">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Journeys</h1>
        <p class="text-sm text-muted-foreground mt-0.5">Automate guest communication end-to-end with AI-powered flows.</p>
      </div>
      <div class="flex shrink-0 gap-2">
        <Button variant="outline" @click="emit('open-marketplace')">
          <Icon name="i-lucide-store" class="mr-2 h-4 w-4" />
          Marketplace
        </Button>
        <Button @click="emit('new-journey')">
          <Icon name="i-lucide-plus" class="mr-2 h-4 w-4" />
          New Journey
        </Button>
      </div>
    </div>

    <div class="flex-1 p-6">
      <div v-if="journeys.length === 0" class="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Icon name="i-lucide-route" class="mb-4 h-12 w-12 text-muted-foreground opacity-40" />
        <h3 class="text-lg font-semibold">No Journeys yet</h3>
        <p class="mt-1 mb-5 text-sm text-muted-foreground max-w-sm">
          Create your first Journey to automate guest communication end-to-end.
        </p>
        <Button @click="emit('new-journey')">
          <Icon name="i-lucide-plus" class="mr-2 h-4 w-4" />
          New Journey
        </Button>
      </div>

      <div v-else class="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="journey in journeys" :key="journey.id">
              <TableCell class="font-medium">{{ journey.name }}</TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Switch
                    :key="`${journey.id}-${journey.status}`"
                    :checked="journey.status === 'active'"
                    :disabled="journey.status === 'draft'"
                    @update:checked="toggleStatus(journey.id)"
                  />
                  <Badge :variant="statusConfig[journey.status]?.variant ?? 'outline'">
                    {{ statusConfig[journey.status]?.label ?? journey.status }}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>{{ journey.steps.length }}</TableCell>
              <TableCell class="text-muted-foreground text-sm">
                {{ getTriggerLabel(journey.triggerType) }}
              </TableCell>
              <TableCell class="text-muted-foreground text-sm">{{ journey.lastModified }}</TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" aria-label="Journey actions">
                      <Icon name="i-lucide-ellipsis" class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="emit('edit-journey', journey)">
                      <Icon name="i-lucide-pencil" class="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive" @click="deleteJourney(journey.id)">
                      <Icon name="i-lucide-trash-2" class="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</template>
