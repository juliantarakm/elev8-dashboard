<script setup lang="ts">
import { bookingWidgets, buildEmbedPreview, getSnippetForForm } from '~/components/booking-widget/data/widgets'
import { listings } from '~/components/listings/data/listings'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const widget = computed(() => bookingWidgets.value.find(item => item.id === route.params.id) ?? null)

const widgetListings = computed(() => {
  if (!widget.value)
    return []

  return listings.value.filter(listing => widget.value!.listingIds.includes(listing.id))
})

const previewWidget = computed(() => widget.value ? buildEmbedPreview(widget.value) : null)

const embedSnippet = computed(() => widget.value ? getSnippetForForm(widget.value) : '')

function goEdit() {
  router.push('/booking-widgets/new')
}

function goBack() {
  router.push('/booking-widgets')
}
</script>

<template>
  <div v-if="widget && previewWidget" class="w-full flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">{{ widget.name }}</h2>
        <p class="text-sm text-muted-foreground">Booking widget detail and embed configuration.</p>
      </div>
      <Button type="button" class="cursor-pointer" @click="goEdit">
        <Icon name="i-lucide-pencil" class="size-4 mr-2" />
        Edit Widget
      </Button>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
      <BookingWidgetPreview :widget="previewWidget" :listings="widgetListings.length > 0 ? widgetListings : listings" />

      <Card>
        <CardHeader>
          <CardTitle class="text-base">Embed Snippet</CardTitle>
          <CardDescription>Use this code on the partner website.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <pre class="overflow-x-auto rounded-md border bg-muted/40 p-4 text-xs leading-6"><code>{{ embedSnippet }}</code></pre>
        </CardContent>
      </Card>
    </div>
  </div>

  <Empty v-else class="min-h-[55vh]">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Icon name="i-lucide-code-2" class="size-6" />
      </EmptyMedia>
      <EmptyTitle>Booking widget not found</EmptyTitle>
      <EmptyDescription>The widget you opened no longer exists.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button type="button" class="cursor-pointer" @click="goBack">
        Back to Booking Widgets
      </Button>
    </EmptyContent>
  </Empty>
</template>
