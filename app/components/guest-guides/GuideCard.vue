<script setup lang="ts">
import type { GuestGuide, GuestGuideLink } from './data/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import GuideStatusBadge from './GuideStatusBadge.vue'

const props = defineProps<{
  guide: GuestGuide
  links: GuestGuideLink[]
}>()

defineEmits<{
  edit: [id: string]
  preview: [id: string]
  links: [id: string]
  send: [id: string]
}>()

const linkStats = computed(() => {
  const total = props.links.length
  const opened = props.links.filter(l => l.openedAt).length
  const submitted = props.links.filter(l => l.status === 'submitted').length
  return { total, opened, submitted }
})
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-start justify-between gap-2">
      <div>
        <CardTitle>{{ guide.title }}</CardTitle>
        <CardDescription v-if="guide.description">{{ guide.description }}</CardDescription>
      </div>
      <GuideStatusBadge :status="guide.status" />
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div class="text-muted-foreground">Listings</div>
          <div class="font-medium">{{ guide.assignedListingIds.length }}</div>
        </div>
        <div>
          <div class="text-muted-foreground">Links sent</div>
          <div class="font-medium">{{ linkStats.total }}</div>
        </div>
        <div>
          <div class="text-muted-foreground">Submitted</div>
          <div class="font-medium">{{ linkStats.submitted }}</div>
        </div>
      </div>
      <div class="mt-4 flex gap-2">
        <Button variant="default" size="sm" @click="$emit('send', guide.id)">
          + Send Link
        </Button>
        <Button variant="outline" size="sm" @click="$emit('edit', guide.id)">
          Edit
        </Button>
        <Button variant="outline" size="sm" @click="$emit('preview', guide.id)">
          Preview
        </Button>
        <Button variant="outline" size="sm" @click="$emit('links', guide.id)">
          Links
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
