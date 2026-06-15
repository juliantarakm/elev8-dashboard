<script setup lang="ts">
import { bookingWidgets } from '~/components/booking-widget/data/widgets'

definePageMeta({ layout: 'default' })

const router = useRouter()

function createBookingWidget() {
  router.push('/booking-widgets/new')
}

function formatDomainCount(domains: string[]) {
  return domains.length === 1 ? '1 domain' : `${domains.length} domains`
}
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Booking Widgets</h2>
        <p class="text-sm text-muted-foreground">Manage embeddable direct-booking widgets.</p>
      </div>
      <Button type="button" class="cursor-pointer" @click="createBookingWidget">
        <Icon name="i-lucide-plus" class="size-4 mr-2" />
        Create New
      </Button>
    </div>

    <main v-if="bookingWidgets.length > 0" class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-3">
      <Card v-for="widget in bookingWidgets" :key="widget.id" class="@container/card">
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <CardTitle class="text-lg font-semibold truncate">{{ widget.name }}</CardTitle>
              <CardDescription>{{ widget.mode === 'single' ? 'Single listing' : 'Multi listing' }}</CardDescription>
            </div>
            <Badge variant="outline" class="shrink-0">{{ widget.listingIds.length }} listings</Badge>
          </div>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="i-lucide-globe" class="size-4" />
            <span>{{ formatDomainCount(widget.allowedDomains) }}</span>
          </div>

          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="i-lucide-percent" class="size-4" />
            <span>{{ widget.depositPct }}% deposit</span>
          </div>

          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <div class="size-4 rounded" :style="{ backgroundColor: widget.accentColor }" />
            <span class="font-mono">{{ widget.accentColor }}</span>
          </div>
        </CardContent>
        <CardFooter class="gap-2 pt-0">
          <Button variant="outline" size="sm" class="flex-1 cursor-pointer" @click="router.push('/booking-widgets/new')">
            <Icon name="i-lucide-pencil" class="size-4 mr-1.5" />
            Edit
          </Button>
        </CardFooter>
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
  </div>
</template>
