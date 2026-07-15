'use client'

import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import type { Model } from '../types'

interface RenameModelDialogProps {
  model: Model | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string, description: string) => void
}

/** Dialog for editing a model's name and description. */
export function RenameModelDialog({
  model,
  open,
  onOpenChange,
  onSubmit,
}: RenameModelDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open && model) {
      setName(model.name)
      setDescription(model.description)
    }
  }, [open, model])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit(name, description)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit model</DialogTitle>
            <DialogDescription>
              Update the name and description for this model.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="model-name">Name</Label>
            <Input
              id="model-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Wind Specialist"
              maxLength={60}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="model-description">Description</Label>
            <Textarea
              id="model-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this model optimized for?"
              rows={3}
              maxLength={200}
            />
          </div>

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
