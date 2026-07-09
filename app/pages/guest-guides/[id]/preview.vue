<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { toast } from 'vue-sonner'

const route = useRoute()
const guideId = computed(() => route.params.id as string)

const { guides } = useGuestGuides()
const { issueLink } = useGuestGuideLinks()
const { conversations } = useInbox()

const guide = computed(() => guides.value.find(g => g.id === guideId.value))

// Issue a throwaway preview link
const previewToken = ref<string | null>(null)

const previewUrl = computed(() => {
  if (!previewToken.value) return null
  return `http://localhost:3001/${previewToken.value}?preview=1`
})

function generatePreviewLink() {
  if (!guide.value) return
  // Use first conversation as preview reservation
  const firstConv = conversations.value[0]
  if (!firstConv) {
    toast.error('No conversations to use for preview')
    return
  }
  try {
    const link = issueLink({
      guideId: guide.value.id,
      reservationId: `preview-${Date.now()}`,
      listingId: firstConv.listingName ?? 'lst-1',
      guestName: 'Preview Guest',
      guestLanguage: 'en',
      channel: 'manual',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      metadata: { templateId: guide.value.templateId },
    })
    previewToken.value = link.token
    toast.success('Preview link generated')
  } catch (err: any) {
    toast.error(err.message ?? 'Failed to generate preview link')
  }
}
</script>

<template>
  <div class="flex h-screen flex-col">
    <div class="flex items-center justify-between border-b p-4">
      <div class="text-sm text-muted-foreground">
        Preview: {{ guide?.title }}
      </div>
      <Button @click="generatePreviewLink">
        Generate preview link
      </Button>
    </div>
    <div class="flex-1 overflow-hidden bg-muted">
      <iframe
        v-if="previewUrl"
        :src="previewUrl"
        class="h-full w-full bg-background"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
      <div v-else class="flex h-full items-center justify-center text-muted-foreground">
        Click "Generate preview link" to start
      </div>
    </div>
  </div>
</template>