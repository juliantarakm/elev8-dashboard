<script setup lang="ts">
defineProps<{
  data: {
    html?: string
    heading?: string
  }
  listing?: any
  token?: string
}>()

const { translate } = useAutoTranslate()

/**
 * Light sanitization: strip <script> tags + inline event handlers.
 * Phase 1 only — Phase 5 swaps to DOMPurify.
 */
const sanitizedHtml = computed(() => {
  let html = (props.data.html ?? '').toString()
  if (!html) return ''
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  html = html.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  html = html.replace(/javascript:/gi, '')
  return html
})
</script>

<template>
  <section class="rounded-xl border bg-card p-6">
    <h2 v-if="data.heading" class="mb-3 text-xl font-semibold">
      {{ translate(data.heading) }}
    </h2>
    <div
      v-if="sanitizedHtml"
      class="prose prose-sm max-w-none text-foreground"
      v-html="sanitizedHtml"
    />
    <p v-else class="text-sm text-muted-foreground">
      {{ translate('No content.') }}
    </p>
  </section>
</template>