'use client'

import { useEffect, useRef } from 'react'

interface DragScrollOptions {
  /** Minimum pixel distance before treating as drag (default: 5) */
  dragThreshold?: number
  /** Multiplier for scroll speed (default: 1) */
  scrollMultiplier?: number
}

/**
 * Hook to add click-and-drag horizontal scrolling to an element.
 * 
 * Features:
 * - Drag to scroll horizontally
 * - Cursor shows 'grab' / 'grabbing'
 * - Prevents text selection during drag
 * - Prevents click events from firing when dragging
 * - Works with Pointer Events (touch + mouse)
 * - Threshold to distinguish clicks from drags
 * 
 * @param options Configuration for drag behavior
 * @returns Ref to attach to the scroll container
 */
export function useDragScroll(options: DragScrollOptions = {}) {
  const { dragThreshold = 5, scrollMultiplier = 1 } = options
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track drag state to prevent unwanted clicks
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
    pointerDownTarget: null as EventTarget | null,
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const dragState = dragStateRef.current

    /**
     * End drag and clean up state
     */
    const endDrag = () => {
      if (dragState.isDragging) {
        dragState.isDragging = false
        container.classList.remove('dragging')
      }
    }

    /**
     * Prevent click events if we were actually dragging
     */
    const handleClick = (e: PointerEvent) => {
      if (dragState.isDragging) {
        e.stopPropagation()
        e.preventDefault()
        dragState.isDragging = false
      }
    }

    /**
     * Start drag tracking on pointer down
     */
    const handlePointerDown = (e: PointerEvent) => {
      // Only track left mouse button
      if (e.button !== 0) return

      dragState.isDragging = false
      dragState.startX = e.clientX
      dragState.startScrollLeft = container.scrollLeft
      dragState.pointerDownTarget = e.target

      // Capture pointer for smooth dragging
      if ((e.target as HTMLElement)?.setPointerCapture) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId)
      }
    }

    /**
     * Handle pointer move to scroll
     */
    const handlePointerMove = (e: PointerEvent) => {
      // Stop dragging if mouse button is no longer held
      if (e.buttons !== 1) {
        if (dragState.isDragging) {
          endDrag()
        }
        return
      }

      // Check if we've moved enough to consider this a drag
      const movedDistance = Math.abs(e.clientX - dragState.startX)
      
      if (movedDistance < dragThreshold) {
        return
      }

      // Mark as dragging once threshold is exceeded
      if (!dragState.isDragging) {
        dragState.isDragging = true
        container.classList.add('dragging')
      }

      // Calculate scroll offset
      const deltaX = e.clientX - dragState.startX
      const newScrollLeft = dragState.startScrollLeft - deltaX * scrollMultiplier

      // Apply scroll
      container.scrollLeft = newScrollLeft
    }

    /**
     * Stop dragging on pointer up
     */
    const handlePointerUp = (e: PointerEvent) => {
      // Release pointer capture
      try {
        if ((e.target as HTMLElement)?.releasePointerCapture) {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId)
        }
      } catch (err) {
        // Ignore errors from releasing capture
      }
      
      // End drag immediately and reset state
      dragState.isDragging = false
      endDrag()
    }

    /**
     * Stop dragging on pointer leave
     */
    const handlePointerLeave = (e: PointerEvent) => {
      // Only stop if we're actually dragging
      if (dragState.isDragging) {
        try {
          if ((e.target as HTMLElement)?.releasePointerCapture) {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId)
          }
        } catch (err) {
          // Ignore errors from releasing capture
        }
        endDrag()
      }
    }

    /**
     * Stop dragging on pointer cancel (e.g., system interruption)
     */
    const handlePointerCancel = (e: PointerEvent) => {
      try {
        if ((e.target as HTMLElement)?.releasePointerCapture) {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId)
        }
      } catch (err) {
        // Ignore errors from releasing capture
      }
      dragState.isDragging = false
      endDrag()
    }

    /**
     * Stop dragging on lost pointer capture (e.g., window blur, focus change)
     */
    const handleLostPointerCapture = (e: PointerEvent) => {
      dragState.isDragging = false
      endDrag()
    }

    /**
     * Stop dragging on window blur
     */
    const handleWindowBlur = () => {
      dragState.isDragging = false
      endDrag()
    }

    // Add event listeners
    container.addEventListener('click', handleClick as EventListener, true)
    container.addEventListener('pointerdown', handlePointerDown as EventListener)
    container.addEventListener('pointermove', handlePointerMove as EventListener)
    container.addEventListener('pointerup', handlePointerUp as EventListener)
    container.addEventListener('pointerleave', handlePointerLeave as EventListener)
    container.addEventListener('pointercancel', handlePointerCancel as EventListener)
    container.addEventListener('lostpointercapture', handleLostPointerCapture as EventListener)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      container.removeEventListener('click', handleClick as EventListener, true)
      container.removeEventListener('pointerdown', handlePointerDown as EventListener)
      container.removeEventListener('pointermove', handlePointerMove as EventListener)
      container.removeEventListener('pointerup', handlePointerUp as EventListener)
      container.removeEventListener('pointerleave', handlePointerLeave as EventListener)
      container.removeEventListener('pointercancel', handlePointerCancel as EventListener)
      container.removeEventListener('lostpointercapture', handleLostPointerCapture as EventListener)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [dragThreshold, scrollMultiplier])

  return containerRef
}
