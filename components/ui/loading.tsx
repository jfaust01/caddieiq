import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

/* ─── Card Skeleton ──────────────────────────────────────────────────────────── */

function CardSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/8 bg-card",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-3.5 w-2/5 rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-4 w-3/4 rounded-md" />
      <Skeleton className="h-4 w-1/2 rounded-md" />
    </div>
  )
}

/* ─── Stat Card Skeleton ─────────────────────────────────────────────────────── */

function StatCardSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/8 bg-card",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-1/3 rounded-md" />
        <Skeleton className="size-7 rounded-lg shrink-0" />
      </div>
      <Skeleton className="h-7 w-2/5 rounded-md" />
      <Skeleton className="h-3 w-1/4 rounded-md" />
    </div>
  )
}

/* ─── Table Skeleton ─────────────────────────────────────────────────────────── */

interface TableSkeletonProps extends React.ComponentProps<"div"> {
  rows?: number
  columns?: number
}

function TableSkeleton({
  rows = 6,
  columns = 4,
  className,
  ...props
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl ring-1 ring-foreground/8 bg-card overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Header row */}
      <div className="flex items-center gap-4 border-b border-border/60 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3 rounded-md"
            style={{ width: `${60 + (i % 3) * 20}px` }}
          />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-border/60 px-4 py-3 last:border-0"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-3.5 rounded-md"
              style={{ width: `${50 + ((r + c) % 4) * 25}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ─── Page Skeleton ──────────────────────────────────────────────────────────── */

function PageSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6 p-6", className)} {...props}>
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-80 rounded-md" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Content */}
      <TableSkeleton rows={5} columns={5} />
    </div>
  )
}

/* ─── Spinner overlay ────────────────────────────────────────────────────────── */

const spinnerSizeVariants = cva("", {
  variants: {
    size: {
      sm:  "size-4",
      md:  "size-5",
      lg:  "size-6",
      xl:  "size-8",
    },
  },
  defaultVariants: { size: "md" },
})

function SpinnerOverlay({
  className,
  size,
  label = "Loading…",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof spinnerSizeVariants> & { label?: string }) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 p-8 text-muted-foreground",
        className
      )}
      role="status"
      aria-label={label}
      {...props}
    >
      <Spinner className={spinnerSizeVariants({ size })} />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export {
  CardSkeleton,
  StatCardSkeleton,
  TableSkeleton,
  PageSkeleton,
  SpinnerOverlay,
}
