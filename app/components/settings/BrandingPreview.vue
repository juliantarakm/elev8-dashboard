<script setup lang="ts">
import type { TenantBranding } from '~/components/settings/data/branding'
import { computed } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getBrandingFaviconHref, resolveInvoiceLogo } from '~/components/settings/data/branding'
import { buildGuestGuideCssVariables } from '~/lib/branding-colors'

const props = defineProps<{ branding: TenantBranding }>()
const guideStyle = computed(() => buildGuestGuideCssVariables(props.branding.guestGuideColors))
const invoiceLogo = computed(() => resolveInvoiceLogo(props.branding))
const faviconHref = computed(() => getBrandingFaviconHref(props.branding))
</script>

<template>
  <div class="rounded-lg border bg-card p-4">
    <div class="mb-4">
      <h3 class="font-medium">
        Live preview
      </h3>
      <p class="text-sm text-muted-foreground">
        Preview unsaved branding changes.
      </p>
    </div>

    <Tabs default-value="dashboard">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="dashboard">
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="guide">
          Guest Guide
        </TabsTrigger>
        <TabsTrigger value="invoice">
          Invoice
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" class="mt-4">
        <div class="overflow-hidden rounded-lg border bg-background">
          <div class="flex items-center gap-2 border-b bg-muted/40 px-3 py-2 text-xs">
            <img v-if="branding.favicon" :src="faviconHref" alt="Favicon preview" class="size-4 object-contain">
            <Icon v-else name="lucide:layout-dashboard" class="size-4" />
            <span>Elev8 Dashboard</span>
          </div>
          <div class="flex min-h-48">
            <aside class="w-40 border-r bg-sidebar p-3 text-sidebar-foreground">
              <div class="flex items-center gap-2">
                <div class="flex size-8 items-center justify-center rounded-lg border bg-background p-1">
                  <img v-if="branding.primaryLogo" :src="branding.primaryLogo.dataUrl" alt="Primary logo preview" class="max-h-full max-w-full object-contain">
                  <Icon v-else name="lucide:gallery-vertical-end" class="size-4" />
                </div>
                <div>
                  <p class="text-xs font-semibold">
                    Acme Inc
                  </p><p class="text-[10px] text-muted-foreground">
                    Enterprise
                  </p>
                </div>
              </div>
            </aside>
            <div class="flex-1 p-4">
              <div class="h-5 w-24 rounded bg-muted" /><div class="mt-4 grid grid-cols-2 gap-2">
                <div class="h-16 rounded border" /><div class="h-16 rounded border" />
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="guide" class="mt-4">
        <div data-testid="guest-guide-preview" class="overflow-hidden rounded-lg border bg-background text-foreground" :style="guideStyle">
          <div v-if="branding.primaryLogo" class="border-b bg-card p-3">
            <img :src="branding.primaryLogo.dataUrl" alt="Guest Guide logo preview" class="h-8 max-w-40 object-contain">
          </div>
          <div class="bg-primary p-5 text-primary-foreground">
            <p class="text-xs uppercase tracking-wide">
              Guest guide
            </p><p class="mt-1 font-semibold">
              Welcome to Villa Serenity
            </p>
          </div>
          <div class="space-y-3 bg-background p-4">
            <div class="rounded-lg border bg-card p-3">
              <p class="text-sm font-medium">
                Good to know
              </p><p class="mt-1 text-xs text-muted-foreground">
                Check-in is available from 3:00 PM.
              </p>
            </div><button type="button" class="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
              View check-in steps
            </button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="invoice" class="mt-4">
        <div class="rounded-lg border bg-background p-5 text-foreground">
          <div class="flex items-start justify-between border-b pb-4">
            <img v-if="invoiceLogo" data-testid="invoice-preview-logo" :src="invoiceLogo.dataUrl" alt="Invoice logo preview" class="h-10 max-w-40 object-contain">
            <div v-else class="text-lg font-bold">
              Elev8
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold">
                INVOICE
              </p><p class="text-xs text-muted-foreground">
                INV-2026-0184
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 py-4 text-xs">
            <div>
              <p class="text-muted-foreground">
                Bill to
              </p><p class="font-medium">
                Anna Schmidt
              </p>
            </div><div class="text-right">
              <p class="text-muted-foreground">
                Property
              </p><p class="font-medium">
                Villa Serenity
              </p>
            </div>
          </div>
          <div class="border-y py-3 text-xs">
            <div class="flex justify-between">
              <span>Accommodation · 3 nights</span><span>CHF 1,250.00</span>
            </div>
          </div>
          <div class="mt-3 flex justify-end gap-8 text-sm font-semibold">
            <span>Total</span><span>CHF 1,250.00</span>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
