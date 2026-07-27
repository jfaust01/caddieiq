'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface PaginationFooterProps {
  currentPage: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

/**
 * Table pagination footer with rows-per-page selector and navigation.
 * Shows current range (1-25 of 74) and previous/next buttons.
 */
export function PaginationFooter({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationFooterProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalItems)

  const canPrevious = currentPage > 1
  const canNext = currentPage < totalPages

  return (
    <div
      className="flex items-center justify-between gap-4 border-t px-4 py-3 text-xs text-muted-foreground"
      style={{ borderColor: 'rgba(130, 155, 168, 0.12)' }}
    >
      {/* Left: Rows per page */}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap">Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="h-9 w-[80px] !rounded-[10px] !border-white/[0.12] !bg-[#111418] !px-3 !py-2 !text-xs font-medium !text-foreground">
            <SelectValue>{pageSize}</SelectValue>
          </SelectTrigger>
          <SelectContent className="!rounded-[10px] border-white/[0.12] !bg-[#0D1318]/95 p-1 !shadow-[0_12px_32px_rgba(0,0,0,0.3)]">
            {[10, 25, 50, 100].map((size) => (
              <SelectItem
                key={size}
                value={String(size)}
                className="rounded-[8px] px-2 py-1.5 text-xs font-medium text-foreground/85 data-[highlighted]:!bg-emerald-500/20 data-[highlighted]:!text-emerald-100 data-[selected]:!bg-emerald-500/15 data-[selected]:!text-emerald-300"
              >
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Middle: Page info */}
      <div className="flex-1 text-center">
        <span>
          Showing {startIndex}–{endIndex} of {totalItems}
        </span>
      </div>

      {/* Right: Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrevious}
          aria-label="Previous page"
          className={cn(
            'h-9 w-9 rounded-[10px] border transition-all duration-200 flex items-center justify-center',
            canPrevious
              ? 'border-white/[0.12] bg-[#111418] hover:border-white/20 hover:bg-white/[0.05]'
              : 'border-white/[0.08] bg-[#0D1117] text-muted-foreground/40 cursor-not-allowed',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
          aria-label="Next page"
          className={cn(
            'h-9 w-9 rounded-[10px] border transition-all duration-200 flex items-center justify-center',
            canNext
              ? 'border-white/[0.12] bg-[#111418] hover:border-white/20 hover:bg-white/[0.05]'
              : 'border-white/[0.08] bg-[#0D1117] text-muted-foreground/40 cursor-not-allowed',
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
