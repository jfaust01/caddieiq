import { z } from 'zod'

export const workspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters.')
    .max(48, 'Workspace name must be 48 characters or fewer.'),
  description: z
    .string()
    .max(240, 'Description must be 240 characters or fewer.')
    .optional(),
})

export type WorkspaceFormValues = z.infer<typeof workspaceSchema>
