<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ content: string }>()

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
  return null
}

// Tokenize content into segments: 'code' (fenced ```lang\n...\n```) or 'text'
type Segment = { kind: 'text', value: string } | { kind: 'code', value: string, lang: string | undefined }

const segments = computed<Segment[]>(() => {
  const out: Segment[] = []
  const re = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(props.content)) !== null) {
    if (m.index > lastIndex) {
      out.push({ kind: 'text', value: props.content.slice(lastIndex, m.index) })
    }
    out.push({ kind: 'code', value: m[2] ?? '', lang: m[1] ?? 'plaintext' })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < props.content.length) {
    out.push({ kind: 'text', value: props.content.slice(lastIndex) })
  }
  return out
})

function renderMarkdown(text: string): string {
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
  <div class="leading-relaxed [&_strong]:font-semibold [&_a]:text-primary [&_code]:font-mono flex flex-col gap-3">
    <template v-for="(seg, i) in segments" :key="i">
      <CodeBlock
        v-if="seg.kind === 'code'"
        :code="seg.value.trimEnd()"
        :language="(seg.lang ?? 'text') as any"
        class="my-1 rounded-md border bg-background"
      />
      <div
        v-else
        v-html="renderMarkdown(seg.value)"
      />
    </template>
  </div>
</template>