'use client'

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  workspaceSchema,
  type WorkspaceFormValues,
} from '@/validators/settings'

const DEFAULT_VALUES: WorkspaceFormValues = {
  name: 'CaddieIQ Workspace',
  description: '',
}

export function WorkspaceForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<WorkspaceFormValues>({
    resolver: standardSchemaResolver(workspaceSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const onSubmit = handleSubmit((values) => {
    // Persistence is wired in a later phase; confirm intent for now.
    toast.success('Workspace settings saved')
    reset(values)
  })

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
          <Input
            id="workspace-name"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          {errors.name ? (
            <FieldError errors={[{ message: errors.name.message ?? '' }]} />
          ) : (
            <FieldDescription>
              Shown across your workspace and in shared links.
            </FieldDescription>
          )}
        </Field>

        <Field data-invalid={Boolean(errors.description)}>
          <FieldLabel htmlFor="workspace-description">Description</FieldLabel>
          <Textarea
            id="workspace-description"
            rows={3}
            placeholder="What is this workspace for?"
            aria-invalid={Boolean(errors.description)}
            {...register('description')}
          />
          {errors.description ? (
            <FieldError
              errors={[{ message: errors.description.message ?? '' }]}
            />
          ) : (
            <FieldDescription>Optional. Up to 240 characters.</FieldDescription>
          )}
        </Field>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            Save changes
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!isDirty || isSubmitting}
            onClick={() => reset()}
          >
            Cancel
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
