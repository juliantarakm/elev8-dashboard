<script setup lang="ts">
defineProps<{
  data: {
    files?: Array<{ id: string; name: string; url: string; size?: number }>
  }
  listing?: any
  token?: string
}>()

const { translate } = useAutoTranslate()

function formatSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <section class="rounded-xl border bg-card p-6">
    <div class="mb-3 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="lucide:file-text" class="size-5" />
      </div>
      <h2 class="text-xl font-semibold">
        {{ translate('Documents') }}
      </h2>
    </div>

    <ul v-if="data.files && data.files.length" class="space-y-2">
      <li
        v-for="file in data.files"
        :key="file.id"
        class="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2"
      >
        <div class="flex min-w-0 items-center gap-2">
          <Icon name="lucide:file" class="size-4 flex-shrink-0 text-muted-foreground" />
          <div class="min-w-0">
            <div class="truncate text-sm font-medium">
              {{ file.name }}
            </div>
            <div v-if="file.size" class="text-xs text-muted-foreground">
              {{ formatSize(file.size) }}
            </div>
          </div>
        </div>
        <a
          :href="file.url"
          :download="file.name"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90"
        >
          <Icon name="lucide:download" class="size-3" />
          {{ translate('Download') }}
        </a>
      </li>
    </ul>
    <p v-else class="text-sm text-muted-foreground">
      {{ translate('No documents available.') }}
    </p>
  </section>
</template>