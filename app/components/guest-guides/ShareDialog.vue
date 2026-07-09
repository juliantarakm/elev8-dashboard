<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'

const props = defineProps<{
  open: boolean
  url: string
  guestName: string
  guestPhone?: string
  guestEmail?: string
}>()

defineEmits<{ 'update:open': [v: boolean] }>()

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.url)
    toast.success('Link copied to clipboard')
  } catch {
    toast.error('Failed to copy')
  }
}

function shareWhatsApp() {
  const text = encodeURIComponent(`Hi ${props.guestName}, here's your guest guide: ${props.url}`)
  window.open(`https://wa.me/?text=${text}`, '_blank')
}

function shareEmail() {
  const subject = encodeURIComponent('Your Guest Guide')
  const body = encodeURIComponent(`Hi ${props.guestName},\n\nHere's your guest guide for your upcoming stay:\n${props.url}\n\nPlease complete the pre-arrival info at your earliest convenience.`)
  window.open(`mailto:${props.guestEmail ?? ''}?subject=${subject}&body=${body}`)
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Share Guest Guide</DialogTitle>
        <DialogDescription>Send this link to {{ guestName }} via your preferred channel.</DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div class="rounded-md bg-muted p-3 font-mono text-sm break-all">
          {{ url }}
        </div>
        <Button variant="outline" class="w-full" @click="copyLink">
          Copy link
        </Button>
        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" @click="shareWhatsApp">
            WhatsApp
          </Button>
          <Button variant="outline" @click="shareEmail">
            Email
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>