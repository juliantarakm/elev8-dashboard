<script setup lang="ts">
defineProps<{ content: string }>()

// Minimal markdown: **bold**, *italic*, `code`, - lists, [links](url)
// For v1 we render manually rather than pulling in a heavy markdown lib.
function sanitizeHref(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('javascript:')
    || lower.startsWith('data:')
    || lower.startsWith('vbscript:')
  ) {
    return null
  }
  if (
    lower.startsWith('http://')
    || lower.startsWith('https://')
    || lower.startsWith('mailto:')
  ) {
    try {
      return encodeURI(trimmed)
    }
    catch {
      return null
    }
  }
  // Unknown scheme (e.g. relative, custom scheme) — reject to be safe.
  return null
}

function renderMarkdown(text: string): string {
  // Order matters: escape first, then apply transforms
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-background/50 px-1 py-0.5 text-xs font-mono">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_match, label: string, url: string) => {
      const safe = sanitizeHref(url)
      if (!safe) return label
      return `<a href="${safe}" target="_blank" rel="noopener" class="underline">${label}</a>`
    })
    .replace(/\n/g, '<br />')
}
</script>

<template>
  <div
    class="leading-relaxed [&_strong]:font-semibold [&_a]:text-primary [&_code]:font-mono"
    v-html="renderMarkdown(content)"
  />
</template>