<script setup lang="ts">
export interface AssistantAttachment {
  id: string
  name: string
  type: string                              // MIME type, e.g. 'image/png'
  size: number                              // bytes
  url?: string                              // optional preview URL
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
      :data="{
        type: getMediaCategory(att),
        url: att.url,
        filename: att.name,
        mediaType: att.type,
      }"
      @remove="emit('remove', att.id)"
    >
      <AttachmentPreview v-if="getMediaCategory(att) === 'image' && att.url" />
      <AttachmentInfo>
        <span class="text-xs">{{ att.name }}</span>
        <span class="text-[10px] text-muted-foreground">{{ formatSize(att.size) }}</span>
      </AttachmentInfo>
    </Attachment>
  </Attachments>
</template>