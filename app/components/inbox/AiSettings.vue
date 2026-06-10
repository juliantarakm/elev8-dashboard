<script setup lang="ts">
import { toast } from 'vue-sonner'
import { allProperties } from '~/components/listings/data/listings'

const open = defineModel<boolean>('open', { default: false })

interface AiConfig {
  id: string
  name: string
  listings: string[]
  deferBehavior: string
  directContact: string
  useSignature: boolean
  signatureText: string
  conversationClosing: string
  aiTransparency: string
  languageMode: string
  customLanguage: string
  stopOnNegative: boolean
  minDelay: number
  maxDelay: number
  customTone: string
}

function makeDefaultConfig(id: string, name = 'New Config', listings: string[] = []): AiConfig {
  return { id, name, listings, deferBehavior: 'defer_host', directContact: '', useSignature: true, signatureText: 'On behalf of the Elevate Team\nEva', conversationClosing: 'yes', aiTransparency: 'if_asked', languageMode: 'guest', customLanguage: '', stopOnNegative: true, minDelay: 2, maxDelay: 6, customTone: '' }
}

const configs = ref<AiConfig[]>([{
  ...makeDefaultConfig('default', 'default'),
  listings: [],
  customTone: 'Under no circumstances can a guest check in early without approval from the hosting team. Approval must be confirmed with our team in advance. for all messages, use a nicly format with new lines. you can use emojis if appropriate, but not to much.',
}])

const selectedConfigId = ref('default')
const selectedConfig = computed(() => configs.value.find(c => c.id === selectedConfigId.value)!)

const deferOptions = [
  { value: 'defer_host', label: 'Defer to host', example: '...the host will assist once they\'re back online...' },
  { value: 'defer_team', label: 'Defer to team', example: '...I\'ll have to check with the team...' },
  { value: 'embody_host', label: 'Embody host', example: '...I will check and get back to you...' },
  { value: 'share_contact', label: 'Share direct contact', example: '...please contact the host at...' },
  { value: 'do_not_respond', label: 'Do not respond', example: '' },
]

function addConfig() {
  const id = `config-${Date.now()}`
  configs.value.push(makeDefaultConfig(id))
  selectedConfigId.value = id
}

function deleteConfig(id: string) {
  if (id === 'default')
    return
  configs.value = configs.value.filter(c => c.id !== id)
  selectedConfigId.value = 'default'
}

function toggleListing(listing: string) {
  const cfg = selectedConfig.value
  cfg.listings = cfg.listings.includes(listing)
    ? cfg.listings.filter(l => l !== listing)
    : [...cfg.listings, listing]
}

function updateField<K extends keyof AiConfig>(key: K, value: AiConfig[K]) {
  const idx = configs.value.findIndex(c => c.id === selectedConfigId.value)
  if (idx !== -1)
    configs.value[idx] = { ...configs.value[idx], [key]: value }
}

function handleSave() {
  toast.success('Conversation settings saved.')
  open.value = false
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent class="w-[640px] sm:max-w-[640px] flex flex-col p-0 gap-0 items-stretch">
      <SheetHeader class="px-6 pt-5 pb-4 border-b shrink-0 text-left">
        <SheetTitle>AI Conversation Settings</SheetTitle>
        <SheetDescription>Configure how Elev8 AI handles guest conversations.</SheetDescription>
      </SheetHeader>

      <div class="flex flex-1 min-h-0 overflow-hidden items-stretch">
        <!-- Config sidebar -->
        <div class="w-48 shrink-0 border-r flex flex-col">
          <div class="p-3 border-b">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Configs
            </p>
          </div>
          <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
            <button
              v-for="cfg in configs"
              :key="cfg.id"
              type="button"
              class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors" :class="[selectedConfigId === cfg.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted']"
              @click="selectedConfigId = cfg.id"
            >
              <div class="font-medium truncate">
                {{ cfg.name }}
              </div>
              <div class="text-xs mt-0.5 truncate" :class="selectedConfigId === cfg.id ? 'text-primary-foreground/70' : 'text-muted-foreground'">
                {{ cfg.listings.length === 0 ? 'All properties' : `${cfg.listings.length} listing${cfg.listings.length > 1 ? 's' : ''}` }}
              </div>
            </button>
          </div>
          <div class="p-2 border-t">
            <Button variant="outline" size="sm" class="w-full gap-1.5" @click="addConfig">
              <Icon name="lucide:plus" class="size-3.5" />
              Add Config
            </Button>
          </div>
        </div>

        <!-- Config form -->
        <div class="flex-1 min-w-0 overflow-y-auto">
          <div v-if="selectedConfig" class="p-6 space-y-6">
            <!-- Name + delete -->
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-2 flex-1">
                <Input :value="selectedConfig.name" :disabled="selectedConfig.id === 'default'" class="max-w-xs font-medium" @input="updateField('name', ($event.target as HTMLInputElement).value)" />
                <Badge v-if="selectedConfig.id === 'default'" variant="secondary">
                  Default
                </Badge>
              </div>
              <Button v-if="selectedConfig.id !== 'default'" variant="ghost" size="icon" class="text-destructive hover:text-destructive shrink-0" @click="deleteConfig(selectedConfig.id)">
                <Icon name="lucide:trash-2" class="size-4" />
              </Button>
            </div>

            <p class="text-xs text-muted-foreground -mt-4">
              {{ selectedConfig.id === 'default' ? 'This is the default config. It applies to all properties that are not included in any other config.' : 'This config applies to the selected listings below. It overrides the default config for those listings.' }}
            </p>

            <!-- Listings picker -->
            <template v-if="selectedConfig.id !== 'default'">
              <div class="space-y-2">
                <Label class="text-sm font-medium">Apply to Listings</Label>
                <p class="text-xs text-muted-foreground">
                  Select which listings this config applies to.
                </p>
                <div class="rounded-md border p-3 space-y-1.5 max-h-40 overflow-y-auto">
                  <div v-for="listing in allProperties" :key="listing" class="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted" @click="toggleListing(listing)">
                    <div class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border" :class="[selectedConfig.listings.includes(listing) ? 'border-primary bg-primary text-primary-foreground' : 'border-input']">
                      <Icon v-if="selectedConfig.listings.includes(listing)" name="lucide:check" class="size-3" />
                    </div>
                    <span class="text-sm truncate">{{ listing }}</span>
                  </div>
                </div>
              </div>
              <Separator />
            </template>

            <!-- Defer Behavior -->
            <div class="space-y-3">
              <div>
                <Label class="text-sm font-medium">Defer Behavior</Label>
                <p class="text-xs text-muted-foreground mt-0.5">
                  How should Elev8 AI respond when it's not able to resolve the guest's issue?
                </p>
              </div>
              <RadioGroup :model-value="selectedConfig.deferBehavior" class="space-y-2" @update:model-value="updateField('deferBehavior', $event)">
                <div v-for="opt of deferOptions" :key="opt.value" class="flex items-start gap-2">
                  <RadioGroupItem :id="`defer-${selectedConfig.id}-${opt.value}`" :value="opt.value" class="mt-0.5" />
                  <div>
                    <Label :for="`defer-${selectedConfig.id}-${opt.value}`" class="text-sm cursor-pointer">{{ opt.label }}</Label>
                    <p v-if="opt.example" class="text-xs text-muted-foreground italic">
                      Ex. "{{ opt.example }}"
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <!-- Direct Contact -->
            <div class="space-y-2">
              <Label class="text-sm font-medium">Direct Contact</Label>
              <p class="text-xs text-muted-foreground">
                If added, Elev8 AI will provide this to guests in an emergency.
              </p>
              <Input :value="selectedConfig.directContact" placeholder="e.g., John Doe, (888-999-9999)" class="max-w-sm" @input="updateField('directContact', ($event.target as HTMLInputElement).value)" />
            </div>

            <Separator />

            <!-- Use Signature -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <Label class="text-sm font-medium">Use Signature</Label>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    Appended to the end of each message.
                  </p>
                </div>
                <Switch :model-value="selectedConfig.useSignature" @update:model-value="updateField('useSignature', $event)" />
              </div>
              <Textarea v-if="selectedConfig.useSignature" :value="selectedConfig.signatureText" class="max-w-sm resize-none text-sm" rows="2" @input="updateField('signatureText', ($event.target as HTMLTextAreaElement).value)" />
            </div>

            <Separator />

            <!-- Conversation Closing -->
            <div class="space-y-3">
              <div>
                <Label class="text-sm font-medium">Conversation Closing</Label>
                <p class="text-xs text-muted-foreground mt-0.5">
                  Can Elev8 choose not to respond if a conversation is at its natural end?
                </p>
              </div>
              <RadioGroup :model-value="selectedConfig.conversationClosing" class="space-y-2" @update:model-value="updateField('conversationClosing', $event)">
                <div class="flex items-start gap-2">
                  <RadioGroupItem :id="`closing-yes-${selectedConfig.id}`" value="yes" class="mt-0.5" />
                  <Label :for="`closing-yes-${selectedConfig.id}`" class="text-sm cursor-pointer">Yes, Elev8 AI can let conversations close when appropriate</Label>
                </div>
                <div class="flex items-start gap-2">
                  <RadioGroupItem :id="`closing-no-${selectedConfig.id}`" value="no" class="mt-0.5" />
                  <Label :for="`closing-no-${selectedConfig.id}`" class="text-sm cursor-pointer">No, Elev8 AI should always be the last to respond</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <!-- AI Transparency -->
            <div class="space-y-3">
              <div>
                <Label class="text-sm font-medium">AI Transparency</Label>
                <p class="text-xs text-muted-foreground mt-0.5">
                  Can Elev8 communicate that it is an AI assistant?
                </p>
              </div>
              <RadioGroup :model-value="selectedConfig.aiTransparency" class="space-y-2" @update:model-value="updateField('aiTransparency', $event)">
                <div class="flex items-center gap-2">
                  <RadioGroupItem :id="`trans-asked-${selectedConfig.id}`" value="if_asked" />
                  <Label :for="`trans-asked-${selectedConfig.id}`" class="text-sm cursor-pointer">Only if directly asked</Label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioGroupItem :id="`trans-never-${selectedConfig.id}`" value="never" />
                  <Label :for="`trans-never-${selectedConfig.id}`" class="text-sm cursor-pointer">Never</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <!-- Language -->
            <div class="space-y-3">
              <div>
                <Label class="text-sm font-medium">Language</Label>
                <p class="text-xs text-muted-foreground mt-0.5">
                  What language should Elev8 AI use when responding to guests?
                </p>
              </div>
              <RadioGroup :model-value="selectedConfig.languageMode" class="space-y-2" @update:model-value="updateField('languageMode', $event)">
                <div class="flex items-center gap-2">
                  <RadioGroupItem :id="`lang-guest-${selectedConfig.id}`" value="guest" />
                  <Label :for="`lang-guest-${selectedConfig.id}`" class="text-sm cursor-pointer">Whichever language the guest is using</Label>
                </div>
                <div class="flex items-start gap-2">
                  <RadioGroupItem :id="`lang-always-${selectedConfig.id}`" value="always" class="mt-0.5" />
                  <div class="space-y-2">
                    <Label :for="`lang-always-${selectedConfig.id}`" class="text-sm cursor-pointer">Always respond in:</Label>
                    <Input v-if="selectedConfig.languageMode === 'always'" :value="selectedConfig.customLanguage" placeholder="e.g., English, Spanish" class="max-w-xs" @input="updateField('customLanguage', ($event.target as HTMLInputElement).value)" />
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <!-- Stop on Negative Sentiment -->
            <div class="flex items-start justify-between gap-4">
              <div>
                <Label class="text-sm font-medium">Stop Responding When Sentiment Turns Negative</Label>
                <p class="text-xs text-muted-foreground mt-0.5 max-w-sm">
                  If enabled, Elev8 AI will stop responding and let you take over if guest sentiment turns negative.
                </p>
              </div>
              <Switch :model-value="selectedConfig.stopOnNegative" class="shrink-0 mt-0.5" @update:model-value="updateField('stopOnNegative', $event)" />
            </div>

            <Separator />

            <!-- Message Delay -->
            <div class="space-y-3">
              <div>
                <Label class="text-sm font-medium">Message Delay</Label>
                <p class="text-xs text-muted-foreground mt-0.5">
                  Random delay range in minutes. Set both to 0 to respond immediately.
                </p>
              </div>
              <div class="flex items-center gap-6">
                <div class="space-y-1.5">
                  <Label class="text-xs text-muted-foreground">Min Delay</Label>
                  <Input :value="selectedConfig.minDelay" type="number" :min="0" :max="selectedConfig.maxDelay" class="w-24 text-center" @input="updateField('minDelay', Number(($event.target as HTMLInputElement).value))" />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs text-muted-foreground">Max Delay</Label>
                  <Input :value="selectedConfig.maxDelay" type="number" :min="selectedConfig.minDelay" class="w-24 text-center" @input="updateField('maxDelay', Number(($event.target as HTMLInputElement).value))" />
                </div>
              </div>
            </div>

            <Separator />

            <!-- Customize Tone -->
            <div class="space-y-2">
              <div>
                <Label class="text-sm font-medium">Customize Tone <span class="text-muted-foreground font-normal">(optional)</span></Label>
                <p class="text-xs text-muted-foreground mt-0.5">
                  Add instructions to direct Elev8's tone. This is completely optional.
                </p>
              </div>
              <Textarea :value="selectedConfig.customTone" class="text-sm min-h-[100px]" @input="updateField('customTone', ($event.target as HTMLTextAreaElement).value)" />
            </div>

            <div class="flex justify-end pb-2">
              <Button @click="handleSave">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
