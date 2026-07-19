<script setup lang="ts">
import type { TemplateStatus, WhatsAppTemplate } from './data/whatsapp-templates'
import { toast } from 'vue-sonner'
import { statusMeta } from './data/whatsapp-templates'

const emit = defineEmits<{
  createTemplate: []
  editTemplate: [template: WhatsAppTemplate]
}>()

const { templates, approvedTemplates, deleteTemplate, duplicateTemplate, submitTemplate } = useWhatsAppTemplates()
const { isConnected } = useWhatsApp()

const activeTab = ref<TemplateStatus | 'all'>('all')
const search = ref('')
const submittingIds = ref<Set<string>>(new Set())

const filteredTemplates = computed(() => {
  let list = templates.value
  if (activeTab.value !== 'all')
    list = list.filter(t => t.status === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t =>
      t.name.toLowerCase().includes(q)
      || t.category.toLowerCase().includes(q)
      || t.language.toLowerCase().includes(q),
    )
  }
  return list.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
})

const statusCounts = computed(() => {
  const counts: Record<TemplateStatus, number> = {
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    paused: 0,
    disabled: 0,
  }
  templates.value.forEach(t => counts[t.status]++)
  return counts
})

async function handleSubmit(template: WhatsAppTemplate) {
  submittingIds.value.add(template.id)
  const result = await submitTemplate(template.id)
  submittingIds.value.delete(template.id)
  if (result.success) {
    toast.success(`"${template.name}" was approved by Meta`)
  }
  else {
    toast.error(`"${template.name}" was rejected`, { description: template.statusReason ?? result.error })
  }
}

function handleDuplicate(template: WhatsAppTemplate) {
  const copy = duplicateTemplate(template.id)
  if (copy)
    toast.success(`"${copy.name}" duplicated`)
}

function handleDelete(template: WhatsAppTemplate) {
  deleteTemplate(template.id)
  toast.success(`"${template.name}" deleted`)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 border-b bg-background px-6 py-5">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          WhatsApp Templates
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          Build and manage Meta-approved message templates for Journey automations.
        </p>
      </div>
      <Button :disabled="!isConnected" @click="emit('createTemplate')">
        <Icon name="i-lucide-plus" class="mr-2 h-4 w-4" />
        New Template
      </Button>
    </div>

    <!-- WABA not connected -->
    <div v-if="!isConnected" class="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/10">
        <Icon name="logos:whatsapp-icon" class="h-8 w-8" />
      </div>
      <h3 class="text-lg font-semibold">
        Connect WhatsApp Business
      </h3>
      <p class="mt-1 mb-5 max-w-sm text-sm text-muted-foreground">
        You need a connected WhatsApp Business Account before you can create and submit templates.
      </p>
      <Button as-child>
        <NuxtLink to="/settings/integrations">
          Connect WhatsApp Business
        </NuxtLink>
      </Button>
    </div>

    <template v-else>
      <!-- Filters -->
      <div class="border-b px-6 py-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap gap-1">
            <button
              v-for="[key, meta] in Object.entries(statusMeta).concat([['all', { label: 'All', variant: 'secondary', description: '' }]])"
              :key="key"
              class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              :class="activeTab === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'"
              @click="activeTab = key as TemplateStatus | 'all'"
            >
              {{ meta.label }}
              <span
                v-if="key !== 'all'"
                class="rounded-full px-1.5 py-0 text-[10px]"
                :class="activeTab === key ? 'bg-primary-foreground/20' : 'bg-muted'"
              >
                {{ statusCounts[key as TemplateStatus] }}
              </span>
              <span
                v-else
                class="rounded-full px-1.5 py-0 text-[10px]"
                :class="activeTab === key ? 'bg-primary-foreground/20' : 'bg-muted'"
              >
                {{ templates.length }}
              </span>
            </button>
          </div>
          <div class="relative w-full sm:w-64">
            <Icon name="i-lucide-search" class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="search"
              placeholder="Search templates..."
              class="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Empty state -->
        <div v-if="filteredTemplates.length === 0" class="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Icon name="i-lucide-message-square-plus" class="mb-4 h-12 w-12 text-muted-foreground opacity-40" />
          <h3 class="text-lg font-semibold">
            No templates yet
          </h3>
          <p class="mt-1 mb-5 max-w-sm text-sm text-muted-foreground">
            Create your first WhatsApp template to use it in Journey automations.
          </p>
          <Button @click="emit('createTemplate')">
            <Icon name="i-lucide-plus" class="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>

        <!-- Table -->
        <div v-else class="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[280px]">
                  Name
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="w-[130px]">
                  Last Modified
                </TableHead>
                <TableHead class="w-[56px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="template in filteredTemplates" :key="template.id">
                <TableCell class="font-medium">
                  <div class="flex flex-col">
                    <span>{{ template.name }}</span>
                    <span v-if="template.qualityRating" class="text-[10px] text-muted-foreground">
                      Quality: {{ template.qualityRating }}
                    </span>
                  </div>
                </TableCell>
                <TableCell class="capitalize">
                  {{ template.category }}
                </TableCell>
                <TableCell>
                  {{ template.language.toUpperCase() }}
                </TableCell>
                <TableCell>
                  <TooltipProvider :delay-duration="100">
                    <Tooltip v-if="template.status === 'rejected' && template.statusReason">
                      <TooltipTrigger as-child>
                        <Badge :variant="statusMeta[template.status].variant" class="cursor-help">
                          {{ statusMeta[template.status].label }}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" class="max-w-sm">
                        <p class="text-xs">
                          {{ template.statusReason }}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge v-else :variant="statusMeta[template.status].variant">
                      {{ statusMeta[template.status].label }}
                    </Badge>
                  </TooltipProvider>
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {{ formatDate(template.lastModified) }}
                </TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon" aria-label="Template actions">
                        <Icon name="i-lucide-ellipsis" class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="emit('editTemplate', template)">
                        <Icon name="i-lucide-pencil" class="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        v-if="template.status === 'draft' || template.status === 'rejected'"
                        :disabled="submittingIds.has(template.id)"
                        @click="handleSubmit(template)"
                      >
                        <Icon name="i-lucide-send" class="mr-2 h-4 w-4" />
                        Submit for Review
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="handleDuplicate(template)">
                        <Icon name="i-lucide-copy" class="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem class="text-destructive" @click="handleDelete(template)">
                        <Icon name="i-lucide-trash-2" class="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <!-- Approved templates count -->
      <div class="border-t bg-muted/30 px-6 py-2 text-xs text-muted-foreground">
        {{ approvedTemplates.length }} approved template{{ approvedTemplates.length === 1 ? '' : 's' }} available in Journey steps
      </div>
    </template>
  </div>
</template>
