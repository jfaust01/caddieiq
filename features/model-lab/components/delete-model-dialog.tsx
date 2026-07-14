'use client'

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

import type { Model } from '../types'

interface DeleteModelDialogProps {
  model: Model | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** Confirmation dialog for deleting a saved model. */
export function DeleteModelDialog({
  model,
  open,
  onOpenChange,
  onConfirm,
}: DeleteModelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete model?</DialogTitle>
          <DialogDescription>
            {model
              ? `"${model.name}" and its saved versions will be removed. This cannot be undone.`
              : 'This model will be removed.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Delete model
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
