<script setup lang="ts">
import type { GuideTemplate } from '../data/types'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

defineProps<{ template: GuideTemplate }>()
defineEmits<{ use: [] }>()
</script>

<template>
  <Card>
    <CardHeader>
      <Icon :name="`lucide:${template.iconName}`" class="size-6 text-primary" />
      <CardTitle>{{ template.name }}</CardTitle>
      <CardDescription>{{ template.description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="mb-3 text-sm text-muted-foreground">
        {{ template.sections.length }} sections
      </div>
      <Button class="w-full" variant="outline" @click="$emit('use')">
        Use template
      </Button>
    </CardContent>
  </Card>
</template>
