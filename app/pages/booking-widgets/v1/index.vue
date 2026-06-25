<script setup lang="ts">
import { toast } from 'vue-sonner'
import { bookingWidgets } from '~/components/booking-widget/data/widgets'

definePageMeta({ layout: 'default' })

const router = useRouter()

function createBookingWidget() {
  router.push('/booking-widgets/v1/new')
}

const widgets = ref([...bookingWidgets.value])

watch(() => bookingWidgets.value, (val) => {
  widgets.value = [...val]
}, { deep: true, immediate: true })

function setWidgetStatus(widgetId: string, checked: boolean) {
  const idx = widgets.value.findIndex(w => w.id === widgetId)
  if (idx === -1)
    return
  widgets.value[idx] = { ...widgets.value[idx], status: checked ? 'active' : 'inactive' }
  // Sync back to source
  const srcIdx = bookingWidgets.value.findIndex(w => w.id === widgetId)
  if (srcIdx !== -1) {
    bookingWidgets.value[srcIdx] = { ...bookingWidgets.value[srcIdx], status: checked ? 'active' : 'inactive' }
  }
  toast.success(`Widget ${checked ? 'activated' : 'deactivated'}`)
}

const widgetToDelete = ref<string | null>(null)
const deleteDialogOpen = ref(false)

function openDeleteDialog(widgetId: string) {
  widgetToDelete.value = widgetId
  deleteDialogOpen.value = true
}

function confirmDelete() {
  if (!widgetToDelete.value)
    return
  const index = widgets.value.findIndex(w => w.id === widgetToDelete.value)
  if (index !== -1) {
    widgets.value.splice(index, 1)
    const srcIndex = bookingWidgets.value.findIndex(w => w.id === widgetToDelete.value)
    if (srcIndex !== -1)
      bookingWidgets.value.splice(srcIndex, 1)
    toast.success('Widget deleted')
  }
  widgetToDelete.value = null
  deleteDialogOpen.value = false
}
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Booking Widgets v1
        </h2>
        <p class="text-sm text-muted-foreground">
          Manage embeddable direct-booking widgets.
        </p>
      </div>
      <Button type="button" class="cursor-pointer" @click="createBookingWidget">
        <Icon name="i-lucide-plus" class="size-4 mr-2" />
        Create New
      </Button>
    </div>

    <main v-if="widgets.length > 0" class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-3">
      <Card v-for="widget in widgets" :key="widget.id" class="@container/card">
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <CardTitle class="text-lg font-semibold truncate">
                {{ widget.name }}
              </CardTitle>
              <CardDescription class="truncate">
                {{ widget.listingIds.length }} listings
              </CardDescription>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  :class="widget.status === 'active' ? 'bg-primary' : 'bg-input'"
                  @click="setWidgetStatus(widget.id, widget.status !== 'active')"
                >
                  <span
                    class="pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform"
                    :class="widget.status === 'active' ? 'translate-x-4' : 'translate-x-0'"
                  />
                </button>
                <span class="text-xs text-muted-foreground">{{ widget.status === 'active' ? 'Active' : 'Inactive' }}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon-sm" class="size-8">
                    <Icon name="lucide:more-vertical" class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="router.push('/booking-widgets/v1/new')">
                    <Icon name="lucide:pencil" class="size-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="router.push(`/booking-widgets/v1/${widget.id}`)">
                    <Icon name="lucide:eye" class="size-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive focus:text-destructive" @click="openDeleteDialog(widget.id)">
                    <Icon name="lucide:trash-2" class="size-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>
    </main>

    <main v-else class="flex min-h-[55vh] items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon name="i-lucide-code-2" class="size-6" />
          </EmptyMedia>
          <EmptyTitle>No booking widgets yet</EmptyTitle>
          <EmptyDescription>
            Create your first embeddable booking widget to start accepting direct bookings on partner websites.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" class="cursor-pointer" @click="createBookingWidget">
            <Icon name="i-lucide-plus" class="size-4 mr-2" />
            Create Your First Widget
          </Button>
        </EmptyContent>
      </Empty>
    </main>
    <Dialog v-model:open="deleteDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Widget</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this widget? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="deleteDialogOpen = false">
            Cancel
          </Button>
          <Button variant="destructive" @click="confirmDelete">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
