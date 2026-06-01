<script setup lang="ts">
import type { RoutingRule, RuleConditionType, RuleRouteTo } from '@/composables/useWhatsAppRules'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  conditionTypeLabels,
  routeToLabels,

  ruleConditionText,

  useWhatsAppRules,
} from '@/composables/useWhatsAppRules'

const { rules, saveRule, deleteRule, toggleRule } = useWhatsAppRules()

const dialogOpen = ref(false)
const draft = ref<RoutingRule | null>(null)

function openAdd() {
  draft.value = { id: `r${Date.now()}`, name: '', active: true, conditionType: 'keywords', conditionValue: '', routeTo: 'staff_pause' }
  dialogOpen.value = true
}

function openEdit(rule: RoutingRule) {
  draft.value = { ...rule }
  dialogOpen.value = true
}

function save() {
  if (!draft.value)
    return
  if (!draft.value.name.trim()) {
    toast.error('Rule name is required.')
    return
  }
  saveRule({ ...draft.value })
  dialogOpen.value = false
  toast.success('Routing rule saved.')
}

function remove(rule: RoutingRule) {
  deleteRule(rule.id)
  toast.info('Rule deleted.')
}
</script>

<template>
  <div class="rounded-lg border bg-card p-5">
    <div class="mb-1 flex items-center justify-between">
      <p class="text-sm font-semibold">
        WhatsApp Routing Rules
      </p>
      <Button size="sm" variant="outline" class="gap-1" @click="openAdd">
        <Icon name="i-lucide-plus" class="h-4 w-4" /> Add Rule
      </Button>
    </div>
    <p class="mb-4 text-xs text-muted-foreground">
      Rules are evaluated top-to-bottom. First match wins.
    </p>

    <div class="divide-y rounded-md border">
      <div v-for="rule in rules" :key="rule.id" class="flex gap-3 p-3">
        <Icon name="i-lucide-grip-vertical" class="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <p class="truncate text-sm font-medium">
              {{ rule.name }}
            </p>
            <button
              class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="rule.active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'"
              @click="toggleRule(rule.id)"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="rule.active ? 'bg-green-500' : 'bg-slate-400'" />
              {{ rule.active ? 'Active' : 'Off' }}
            </button>
          </div>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ ruleConditionText(rule) }}
          </p>
          <p class="text-xs text-muted-foreground">
            → Route to: {{ routeToLabels[rule.routeTo] }}
          </p>
          <div class="mt-2 flex gap-3 text-xs">
            <button class="font-medium text-primary hover:underline" @click="openEdit(rule)">
              Edit
            </button>
            <button v-if="!rule.isDefault" class="font-medium text-destructive hover:underline" @click="remove(rule)">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <Dialog v-model:open="dialogOpen">
      <DialogContent v-if="draft" class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ rules.some(r => r.id === draft!.id) ? 'Edit' : 'Add' }} Routing Rule</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <Label>Rule name</Label>
            <Input v-model="draft.name" placeholder="e.g. Complaint Keywords → Staff" />
          </div>
          <div class="space-y-1.5">
            <Label>Condition type</Label>
            <Select v-model="draft.conditionType">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(label, key) in conditionTypeLabels" :key="key" :value="key as RuleConditionType">
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label>{{ draft.conditionType === 'keywords' ? 'Keywords' : 'Value' }}</Label>
            <Input v-model="draft.conditionValue" placeholder="complaint, refund, angry, manager" />
          </div>
          <div class="space-y-1.5">
            <Label>Route to</Label>
            <Select v-model="draft.routeTo">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(label, key) in routeToLabels" :key="key" :value="key as RuleRouteTo">
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="dialogOpen = false">
            Cancel
          </Button>
          <Button @click="save">
            Save Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
