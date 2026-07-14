"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/* ─── Container ─────────────────────────────────────────────────────────────── */

const tableContainerVariants = cva(
  "relative w-full overflow-x-auto rounded-xl",
  {
    variants: {
      variant: {
        default: "ring-1 ring-foreground/8 bg-card",
        flat:    "bg-transparent",
        outlined:"ring-1 ring-border bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function TableContainer({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof tableContainerVariants>) {
  return (
    <div
      data-slot="table-container"
      className={cn(tableContainerVariants({ variant }), className)}
      {...props}
    />
  )
}

/* ─── Table ──────────────────────────────────────────────────────────────────── */

const tableVariants = cva("w-full caption-bottom text-sm", {
  variants: {
    density: {
      comfortable: "[--table-cell-py:0.625rem]",
      dense:       "[--table-cell-py:0.375rem]",
    },
    striped: {
      true:  "[&_tbody_tr:nth-child(even)]:bg-muted/30",
      false: "",
    },
  },
  defaultVariants: { density: "comfortable", striped: false },
})

function Table({
  className,
  density,
  striped,
  ...props
}: React.ComponentProps<"table"> & VariantProps<typeof tableVariants>) {
  return (
    <table
      data-slot="table"
      className={cn(tableVariants({ density, striped }), className)}
      {...props}
    />
  )
}

/* ─── Head ───────────────────────────────────────────────────────────────────── */

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-border/60", className)}
      {...props}
    />
  )
}

/* ─── Body ───────────────────────────────────────────────────────────────────── */

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

/* ─── Footer ─────────────────────────────────────────────────────────────────── */

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-border/60 bg-muted/30 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

/* ─── Row ────────────────────────────────────────────────────────────────────── */

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border/60 transition-colors duration-[80ms] hover:bg-muted/40 has-aria-expanded:bg-muted/40 data-[state=selected]:bg-accent/40",
        className
      )}
      {...props}
    />
  )
}

/* ─── Head cell ──────────────────────────────────────────────────────────────── */

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-3 py-2.5 text-left align-middle text-xs font-medium tracking-wide text-muted-foreground uppercase whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

/* ─── Cell ───────────────────────────────────────────────────────────────────── */

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-[var(--table-cell-py,0.625rem)] align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

/* ─── Caption ────────────────────────────────────────────────────────────────── */

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/* ─── Sort header ────────────────────────────────────────────────────────────── */

type SortDirection = "asc" | "desc" | false

interface TableSortHeadProps extends React.ComponentProps<"th"> {
  sorted?: SortDirection
  onSort?: () => void
}

function TableSortHead({ className, sorted, onSort, children, ...props }: TableSortHeadProps) {
  return (
    <th
      data-slot="table-sort-head"
      className={cn(
        "h-10 px-3 py-2.5 text-left align-middle text-xs font-medium tracking-wide text-muted-foreground uppercase whitespace-nowrap",
        onSort && "cursor-pointer select-none hover:text-foreground",
        className
      )}
      onClick={onSort}
      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
      {...props}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {sorted === "asc"  && <ArrowUpIcon   className="size-3 shrink-0" />}
        {sorted === "desc" && <ArrowDownIcon  className="size-3 shrink-0" />}
        {!sorted           && <ArrowUpDownIcon className="size-3 shrink-0 opacity-40" />}
      </span>
    </th>
  )
}

/* ─── Toolbar ────────────────────────────────────────────────────────────────── */

function TableToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-toolbar"
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2.5",
        className
      )}
      {...props}
    />
  )
}

/* ─── Sticky header wrapper ──────────────────────────────────────────────────── */

function TableStickyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-sticky"
      className={cn("relative overflow-auto", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableContainer,
  tableContainerVariants,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableSortHead,
  TableRow,
  TableCell,
  TableCaption,
  TableToolbar,
  TableStickyHeader,
}
