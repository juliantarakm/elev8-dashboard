<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent } from '~/components/ui/card'
import GuideCard from '~/components/guest-guides/GuideCard.vue'
import SendLinkDialog from '~/components/guest-guides/SendLinkDialog.vue'
import { toast } from 'vue-sonner'

const { guides } = useGuestGuides()
const { links } = useGuestGuideLinks()

const search = ref('')
const statusFilter = ref<'all' | 'active' | 'draft' | 'archived'>('all')

const sendDialogOpen = ref(false)
const sendDialogGuideId = ref<string | null>(null)

// Aggregate KPIs across all guides
const allLinks = computed(() => links.value)
const totalSent = computed(() => allLinks.value.length)
const totalOpened = computed(() => allLinks.value.filter(l => l.openedAt).length)
const totalSubmitted = computed(() => allLinks.value.filter(l => l.status === 'submitted').length)
const openRate = computed(() => totalSent.value === 0
  ? 0
  : Math.round((totalOpened.value / totalSent.value) * 100))
const submitRate = computed(() => totalSent.value === 0
  ? 0
  : Math.round((totalSubmitted.value / totalSent.value) * 100))

const filteredGuides = computed(() => {
  return guides.value.filter(g => {
    if (statusFilter.value !== 'all' && g.status !== statusFilter.value) return false
    if (search.value && !g.title.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  })
})

function handleCreate() {
  navigateTo('/guest-guides/new')
}

function handleEdit(id: string) {
  navigateTo(`/guest-guides/${id}`)
}

function handlePreview(id: string) {
  navigateTo(`/guest-guides/${id}/preview`)
}

function handleLinks(id: string) {
  navigateTo(`/guest-guides/${id}/links`)
}

function handleSend(guideId: string) {
  sendDialogGuideId.value = guideId
  sendDialogOpen.value = true
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Guest Guides</h1>
        <p class="text-sm text-muted-foreground">Manage welcome pages for your guests</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="navigateTo('/guest-guides/backfill')">
          <Icon name="lucide:database" class="mr-2 size-4" />
          Backfill
        </Button>
        <Button @click="handleCreate">
          + Create Guide
        </Button>
      </div>
    </div>

    <!-- Aggregate KPIs -->
    <div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="pt-6">
          <div class="text-2xl font-bold">
            {{ totalSent }}
          </div>
          <div class="text-sm text-muted-foreground">
            Links sent
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <div class="text-2xl font-bold">
            {{ openRate }}%
          </div>
          <div class="text-sm text-muted-foreground">
            Open rate
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <div class="text-2xl font-bold">
            {{ submitRate }}%
          </div>
          <div class="text-sm text-muted-foreground">
            Submit rate
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <div class="text-2xl font-bold">
            {{ totalSubmitted }}
          </div>
          <div class="text-sm text-muted-foreground">
            Forms submitted
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="mb-4 flex items-center gap-2">
      <Input v-model="search" placeholder="Search guides..." class="max-w-sm" />
      <div class="flex gap-1 rounded-md border p-1">
        <button
          v-for="status in ['all', 'active', 'draft', 'archived']"
          :key="status"
          class="rounded-sm px-3 py-1 text-sm"
          :class="statusFilter === status ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'"
          @click="statusFilter = status as any"
        >
          {{ status }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <GuideCard
        v-for="guide in filteredGuides"
        :key="guide.id"
        :guide="guide"
        :links="links.filter(l => l.guideId === guide.id)"
        @edit="handleEdit"
        @preview="handlePreview"
        @links="handleLinks"
        @send="handleSend"
      />
    </div>

    <div v-if="filteredGuides.length === 0" class="py-12 text-center text-muted-foreground">
      No guides match your filters.
    </div>

    <SendLinkDialog
      v-if="sendDialogGuideId"
      v-model:open="sendDialogOpen"
      :guide-id="sendDialogGuideId"
    />
  </div>
</template>
