<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { renderTemplate, useWhatsAppTemplates } from '@/composables/useWhatsAppTemplates'

const props = defineProps<{
  guestName: string
  phone: string
  vars?: Record<string, string>
}>()

const emit = defineEmits<{ sent: [{ templateId: string, body: string }] }>()

const open = defineModel<boolean>('open', { default: false })

const selectedId = ref<string>('')

const { waTemplates } = useWhatsAppTemplates()

watch(open, (v) => {
  if (!v)
    selectedId.value = ''
})

const preview = computed(() => {
  const tpl = waTemplates.value.find(t => t.id === selectedId.value)
  if (!tpl)
    return ''
  return renderTemplate(tpl.body, { guest_name: props.guestName.split(' ')[0] ?? props.guestName, ...props.vars })
})

function send() {
  if (!selectedId.value) {
    toast.error('Select a template first.')
    return
  }
  emit('sent', { templateId: selectedId.value, body: preview.value })
  toast.success(`WhatsApp template sent to ${props.guestName}.`)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Send WhatsApp to {{ guestName }}</DialogTitle>
        <DialogDescription>{{ phone }}</DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div class="space-y-1.5">
          <Label>Template</Label>
          <Select v-model="selectedId">
            <SelectTrigger><SelectValue placeholder="Select template…" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="t in waTemplates" :key="t.id" :value="t.id">
                {{ t.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div v-if="preview" class="space-y-1.5">
          <Label>Preview</Label>
          <div class="rounded-lg border bg-green-50 p-3 text-sm leading-relaxed dark:bg-green-950/30">
            {{ preview }}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">
          Cancel
        </Button>
        <Button class="gap-1" @click="send">
          Send <Icon name="i-lucide-arrow-right" class="h-4 w-4" />
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
