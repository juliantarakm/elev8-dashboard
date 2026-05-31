<script setup lang="ts">
import type { Listing, MaintenanceTask } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

const showAddDialog = ref(false)
const newTask = ref({ title: '', assignedTo: '', type: 'cleaning' as MaintenanceTask['type'] })

const statusColors: Record<string, string> = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'outline',
}

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
}

const pendingTasks = computed(() => props.listing.maintenance.tasks.filter(t => t.status !== 'completed'))
const completedTasks = computed(() => props.listing.maintenance.tasks.filter(t => t.status === 'completed'))

function addTask() {
  if (!newTask.value.title.trim()) return
  const task: MaintenanceTask = {
    id: `mt-${Date.now()}`,
    title: newTask.value.title.trim(),
    date: new Date().toISOString().split('T')[0]!,
    assignedTo: newTask.value.assignedTo || 'Unassigned',
    status: 'pending',
    type: newTask.value.type,
  }
  emit('update', {
    ...props.listing,
    maintenance: { ...props.listing.maintenance, tasks: [...props.listing.maintenance.tasks, task] },
  })
  newTask.value = { title: '', assignedTo: '', type: 'cleaning' }
  showAddDialog.value = false
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">Cleaning Schedule</h3>
      <Table v-if="listing.maintenance.cleaningSchedule.length > 0">
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Frequency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in listing.maintenance.cleaningSchedule" :key="item.task">
            <TableCell class="font-medium">{{ item.task }}</TableCell>
            <TableCell><Badge variant="outline" class="text-xs">{{ frequencyLabels[item.frequency] }}</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p v-else class="text-sm text-muted-foreground">No cleaning schedule configured.</p>
    </Card>

    <Card class="p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold">Upcoming Tasks</h3>
        <Dialog v-model:open="showAddDialog">
          <DialogTrigger as-child>
            <Button size="sm" variant="outline" class="h-7 gap-1 text-xs">
              <Icon name="lucide:plus" class="size-3" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Maintenance Task</DialogTitle>
            </DialogHeader>
            <div class="flex flex-col gap-4 py-4">
              <div class="flex flex-col gap-1.5">
                <Label>Task Title</Label>
                <Input v-model="newTask.title" placeholder="e.g. Fix leaking faucet" />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label>Assigned To</Label>
                <Input v-model="newTask.assignedTo" placeholder="e.g. Wayan Adi" />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select v-model="newTask.type">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button @click="addTask">Add Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div class="flex flex-col gap-3">
        <div v-for="task in pendingTasks" :key="task.id" class="flex items-center justify-between rounded-lg border p-3">
          <div class="flex flex-col gap-0.5">
            <span class="text-sm font-medium">{{ task.title }}</span>
            <span class="text-xs text-muted-foreground">{{ formatDate(task.date) }} · {{ task.assignedTo }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="outline" class="text-xs capitalize">{{ task.type }}</Badge>
            <Badge :variant="(statusColors[task.status] as any)" class="text-xs capitalize">{{ task.status.replace('_', ' ') }}</Badge>
          </div>
        </div>
        <p v-if="pendingTasks.length === 0" class="text-sm text-muted-foreground text-center py-4">No pending tasks.</p>
      </div>
    </Card>

    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">Completed</h3>
      <div class="flex flex-col gap-3">
        <div v-for="task in completedTasks" :key="task.id" class="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-60">
          <div class="flex flex-col gap-0.5">
            <span class="text-sm font-medium line-through">{{ task.title }}</span>
            <span class="text-xs text-muted-foreground">{{ formatDate(task.date) }} · {{ task.assignedTo }}</span>
          </div>
          <Badge variant="outline" class="text-xs capitalize">{{ task.type }}</Badge>
        </div>
        <p v-if="completedTasks.length === 0" class="text-sm text-muted-foreground text-center py-4">No completed tasks.</p>
      </div>
    </Card>
  </div>
</template>
