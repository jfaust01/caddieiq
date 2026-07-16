"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { TableHealthReport, TableStatus } from "@/lib/system-health/database-health"

/**
 * Searchable and filterable table health status panel.
 */
export function TableHealthPanel({ tables }: { tables: TableHealthReport[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<TableStatus | "all">("all")

  const statusOptions: Array<TableStatus | "all"> = [
    "all",
    "Healthy",
    "Waiting",
    "Expected Empty",
    "Import Pending",
    "Unused",
    "Future Feature",
    "Error",
    "Critical",
  ]

  const filtered = useMemo(() => {
    return tables.filter((t) => {
      const matchesSearch =
        t.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.purpose.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = selectedStatus === "all" || t.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, selectedStatus, tables])

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "Healthy":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      case "Waiting":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400"
      case "Expected Empty":
        return "bg-slate-500/15 text-slate-600 dark:text-slate-400"
      case "Import Pending":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      case "Unused":
        return "bg-gray-500/15 text-gray-600 dark:text-gray-400"
      case "Future Feature":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400"
      case "Error":
        return "bg-orange-500/15 text-orange-600 dark:text-orange-400"
      case "Critical":
        return "bg-destructive/15 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 50) return "text-amber-600 dark:text-amber-400"
    return "text-destructive"
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search tables by name or purpose..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              selectedStatus === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table Name</TableHead>
              <TableHead className="text-right">Rows</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead className="text-center">Expected</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No tables match your search criteria
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((table) => (
                <TableRow key={table.tableName} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm font-medium">{table.tableName}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{table.rowCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={cn("", getStatusColor(table.status))}>{table.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs text-sm">
                    <div className="line-clamp-1">{table.purpose}</div>
                  </TableCell>
                  <TableCell className="text-center">{table.expected ? "✓" : "○"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {table.lastUpdatedAt ? formatTimestamp(table.lastUpdatedAt) : "—"}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono text-sm font-medium", getHealthScoreColor(table.healthScore))}>
                    {table.healthScore}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Explanations */}
      {filtered.some((t) => t.explanation) && (
        <div className="space-y-2 rounded-md bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">Empty Table Notes:</p>
          {filtered
            .filter((t) => t.explanation)
            .map((table) => (
              <div key={table.tableName} className="text-xs text-muted-foreground">
                <span className="font-medium">{table.tableName}:</span> {table.explanation}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return isoString.slice(0, 10)
}
