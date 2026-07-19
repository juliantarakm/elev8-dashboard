<script setup lang="ts">
import type { WhatsAppTemplate } from './data/whatsapp-templates'

const props = defineProps<{
  template: WhatsAppTemplate
}>()

const sampleValues: Record<string, string> = {
  guest_name: 'Alex',
  guest_full_name: 'Alex Morgan',
  property_name: 'Villa Kastila',
  city: 'Canggu',
  check_in_date: 'Aug 12, 2026',
  check_out_date: 'Aug 18, 2026',
  nights: '6',
  guests: '4',
  door_code: '2847',
  wifi_name: 'VillaGuest',
  wifi_password: 'sunset2026',
  guide_link: 'https://guestguide.example.com/vk',
  host_name: 'Komang',
  host_phone: '+62 812 3456 7890',
}

function renderBody(body: string): string {
  return body.replace(/\{\{([^}]+)\}\}/g, (_match, key) => {
    return sampleValues[key] ?? `{{${key}}}`
  })
}

const renderedBody = computed(() => renderBody(props.template.body))
</script>

<template>
  <div class="flex flex-col h-full">
    <p class="text-xs font-medium text-muted-foreground mb-3">
      Live preview
    </p>
    <div class="flex-1 rounded-2xl border bg-[#E5DDD5] dark:bg-[#1F1F1F] p-4 overflow-y-auto">
      <div class="max-w-[85%] ml-auto">
        <div class="rounded-lg rounded-tr-sm bg-[#DCF8C6] dark:bg-[#056162] px-3 py-2 shadow-sm">
          <!-- Header text -->
          <p v-if="template.header.type === 'text' && template.header.text" class="text-sm font-semibold mb-1">
            {{ template.header.text }}
          </p>

          <!-- Header media placeholders -->
          <div
            v-else-if="template.header.type === 'image'"
            class="mb-2 -mx-3 -mt-2 rounded-t-lg bg-muted aspect-video flex items-center justify-center overflow-hidden"
          >
            <img
              v-if="template.header.mediaUrl"
              :src="template.header.mediaUrl"
              alt="Header"
              class="h-full w-full object-cover"
            >
            <div v-else class="flex flex-col items-center gap-1 text-muted-foreground">
              <Icon name="i-lucide-image" class="h-6 w-6" />
              <span class="text-[10px]">Image header</span>
            </div>
          </div>

          <div
            v-else-if="template.header.type === 'video'"
            class="mb-2 -mx-3 -mt-2 rounded-t-lg bg-muted aspect-video flex items-center justify-center"
          >
            <div class="flex flex-col items-center gap-1 text-muted-foreground">
              <Icon name="i-lucide-video" class="h-6 w-6" />
              <span class="text-[10px]">Video header</span>
            </div>
          </div>

          <div
            v-else-if="template.header.type === 'document'"
            class="mb-2 -mx-3 -mt-2 rounded-t-lg bg-muted p-4 flex items-center gap-2"
          >
            <Icon name="i-lucide-file-text" class="h-5 w-5 text-muted-foreground" />
            <span class="text-xs text-muted-foreground">{{ template.header.mediaFilename || 'Document.pdf' }}</span>
          </div>

          <!-- Body -->
          <p class="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
            {{ renderedBody }}
          </p>

          <!-- Footer -->
          <p v-if="template.footer" class="mt-1 text-[11px] text-muted-foreground">
            {{ template.footer }}
          </p>
        </div>

        <!-- Buttons -->
        <div v-if="template.buttons.length > 0" class="mt-1 rounded-lg bg-white dark:bg-card border shadow-sm overflow-hidden">
          <button
            v-for="(btn, idx) in template.buttons"
            :key="btn.id"
            class="w-full px-3 py-2 text-xs font-medium text-center transition-colors hover:bg-muted/50"
            :class="[idx > 0 ? 'border-t' : '']"
          >
            <span class="flex items-center justify-center gap-1">
              <Icon
                v-if="btn.kind === 'cta_url'"
                name="i-lucide-external-link"
                class="h-3 w-3"
              />
              <Icon
                v-else-if="btn.kind === 'cta_phone'"
                name="i-lucide-phone"
                class="h-3 w-3"
              />
              {{ btn.text }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
