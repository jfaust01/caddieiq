/**
 * Centralized toast helpers for CaddieIQ.
 * Wraps sonner's `toast` with consistent styling.
 *
 * Usage:
 *   import { toastSuccess, toastError, toastLoading } from '@/lib/toast'
 *   toastSuccess('Saved successfully')
 *   toastError('Something went wrong')
 *   const id = toastLoading('Saving…')
 *   toast.dismiss(id)
 */

import { toast } from 'sonner'

export function toastSuccess(message: string, description?: string) {
  return toast.success(message, {
    description,
    duration: 4000,
  })
}

export function toastError(message: string, description?: string) {
  return toast.error(message, {
    description,
    duration: 6000,
  })
}

export function toastInfo(message: string, description?: string) {
  return toast.info(message, {
    description,
    duration: 4000,
  })
}

export function toastWarning(message: string, description?: string) {
  return toast.warning(message, {
    description,
    duration: 5000,
  })
}

export function toastLoading(message: string, description?: string) {
  return toast.loading(message, {
    description,
  })
}

export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error:   string | ((err: unknown) => string)
  }
) {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error:   messages.error,
  })
}

export { toast }
