import { z } from 'zod'

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
  listing: z.string().optional(),
  description: z.string().optional(),
  linkedInventoryItemId: z.string().optional(),
  linkedInventoryItemName: z.string().optional(),
  linkedInventoryEntryId: z.string().optional(),
  conditionBefore: z.string().optional(),
  detectedByHostBuddy: z.boolean().optional(),
})

export type Task = z.infer<typeof taskSchema>
