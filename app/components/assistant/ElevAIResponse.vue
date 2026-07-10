<script setup lang="ts">
defineProps<{ content: string }>()

// Minimal markdown: **bold**, *italic*, `code`, - lists, [links](url)
// For v1 we render manually rather than pulling in a heavy markdown lib.
function renderMarkdown(text: string): string {
  // Order matters: escape first, then apply transforms
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-background/50 px-1 py-0.5 text-xs font-mono">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="underline">$1</a>')
    .replace(/\n/g, '<br />')
}
</script>

<template>
  <div
    class="leading-relaxed [&_strong]:font-semibold [&_a]:text-primary [&_code]:font-mono"
    v-html="renderMarkdown(content)"
  />
</template>