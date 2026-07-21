'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ColumnConfig {
  id: string
  label: string
  accessor: string | ((row: any) => React.ReactNode)
  sortable?: boolean
  sortFn?: (a: any, b: any) => number
  width?: string
  align?: 'left' | 'center' | 'right'
  hidden?: boolean
}

export interface DataTableProps {
  columns: ColumnConfig[]
  data: any[]
  onRowClick?: (row: any) => void
  className?: string
  responsive?: boolean
  maxHeight?: string
}

export function DataTable({
  columns,
  data,
  onRowClick,
  className = '',
  responsive = true,
  maxHeight,
}: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const visibleColumns = columns.filter((col) => !col.hidden)

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data

    const sorted = [...data].sort((a, b) => {
      const aVal =
        typeof sortConfig.key === 'string'
          ? a[sortConfig.key]
          : sortConfig.key
      const bVal =
        typeof sortConfig.key === 'string'
          ? b[sortConfig.key]
          : sortConfig.key

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [data, sortConfig])

  const handleSort = (columnId: string) => {
    setSortConfig((current) => {
      if (current?.key === columnId) {
        return current.direction === 'asc'
          ? { key: columnId, direction: 'desc' }
          : null
      }
      return { key: columnId, direction: 'asc' }
    })
  }

  const getCellValue = (row: any, column: ColumnConfig) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row)
    }
    return row[column.accessor]
  }

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <div
      className={`rounded-lg border border-border/50 overflow-hidden ${className}`}
      style={maxHeight ? { maxHeight, overflow: 'auto' } : {}}
    >
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-b border-border/50">
            {visibleColumns.map((column) => (
              <TableHead
                key={column.id}
                className={`${alignClass[column.align || 'left']} py-3 px-4`}
                style={column.width ? { width: column.width } : {}}
              >
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent gap-2 font-semibold text-muted-foreground"
                    onClick={() => handleSort(column.id)}
                  >
                    {column.label}
                    <ArrowUpDown className="w-4 h-4 opacity-50" />
                  </Button>
                ) : (
                  <span className="font-semibold text-muted-foreground">
                    {column.label}
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length > 0 ? (
            sortedData.map((row, idx) => (
              <TableRow
                key={idx}
                className={`border-b border-border/50 last:border-0 ${
                  onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''
                } transition-colors`}
                onClick={() => onRowClick?.(row)}
              >
                {visibleColumns.map((column) => (
                  <TableCell
                    key={`${idx}-${column.id}`}
                    className={`${alignClass[column.align || 'left']} py-3 px-4`}
                  >
                    {getCellValue(row, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length}
                className="py-8 text-center text-muted-foreground"
              >
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
