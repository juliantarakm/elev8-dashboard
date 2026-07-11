<script setup lang="ts">
export interface AssistantAttachment {
  id: string
  name: string
  type: string                              // MIME type, e.g. 'image/png'
  size: number                              // bytes
  url?: string                              // optional preview URL (blob URL for images)
}

const props = defineProps<{
  attachments: AssistantAttachment[]
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

function getMediaCategory(att: AssistantAttachment): 'image' | 'video' | 'audio' | 'document' {
  if (att.type.startsWith('image/')) return 'image'
  if (att.type.startsWith('video/')) return 'video'
  if (att.type.startsWith('audio/')) return 'audio'
  return 'document'
}

// Map our MIME-typed attachment to ai-elements AttachmentData shape.
function toAttachmentData(att: AssistantAttachment) {
  return {
    type: 'file' as const,                  // ai-elements expects 'file' | 'inline-data' | 'symbol'
    url: att.url ?? '',
    filename: att.name,
    mediaType: att.type,
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
  <Attachments
    v-if="attachments.length > 0"
    variant="grid"
    class="px-3 pb-1"
    data-testid="elev-ai-attachments"
  >
    <Attachment
      v-for="att in attachments"
      :key="att.id"
      :data="toAttachmentData(att)"
      @remove="emit('remove', att.id)"
    >
      <!-- Auto-detects media category from context. For images with a url,
           renders the actual image; otherwise renders a category icon. -->
      <AttachmentPreview />

      <!-- Only visible in non-grid variants, but useful for showing the
           filename + size beneath grid previews too. -->
      <AttachmentInfo
        v-if="getMediaCategory(att) !== 'image'"
        class="absolute bottom-1 left-1 right-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-center"
      >
        <span class="block truncate text-[10px]">{{ att.name }}</span>
        <span class="block text-[9px] text-muted-foreground">{{ formatSize(att.size) }}</span>
      </AttachmentInfo>

      <!-- Calls remove() from Attachment's provide context, which bubbles
           up to the @remove handler on <Attachment> above. -->
      <AttachmentRemove label="Remove attachment" />
    </Attachment>
  </Attachments>
</template>