import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type {
  PlatformInventory,
  PlatformInventoryEntry,
  PlatformInventorySummary,
  TableHealth,
} from "@/lib/data-coverage/types"

import { TableHealthBadge } from "./indicators"
import { ProviderBadge } from "./provider-badge"

/**
 * The six inventory buckets, in the order the sprint brief lists them. Each maps
 * to a count on the summary and a themed tile so admins can see the platform's
 * table-level health at a glance before reading the full table.
 */
const BUCKETS: ReadonlyArray<{
  key: keyof Omit<PlatformInventorySummary, "total">
  health: TableHealth
  label: string
  hint: string
}> = [
  { key: "healthy", health: "healthy", label: "Healthy", hint: "Hold the data they should" },
  { key: "waiting", health: "waiting", label: "Waiting", hint: "Fill through usage or a dependency" },
  { key: "future", health: "future", label: "Future", hint: "Reserved for an unbuilt sprint" },
  {
    key: "providerLimited",
    health: "provider-limited",
    label: "Provider Limited",
    hint: "Blocked by the current provider tier",
  },
  { key: "obsolete", health: "obsolete", label: "Obsolete", hint: "No longer required" },
  { key: "broken", health: "broken", label: "Broken", hint: "Should have data but do not" },
]

/** The accent ring/text per bucket, mirroring the badge palette. */
const TILE_ACCENT: Record<TableHealth, string> = {
  healthy: "text-success",
  waiting: "text-primary",
  future: "text-muted-foreground",
  "provider-limited": "text-warning-foreground",
  obsolete: "text-muted-foreground",
  broken: "text-destructive",
}

function BucketTile({
  count,
  health,
  label,
  hint,
}: {
  count: number
  health: TableHealth
  label: string
  hint: string
}) {
  return (
    <Card className="gap-0" size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className={cn("text-2xl font-semibold tabular-nums", TILE_ACCENT[health])}>
          {count}
        </span>
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground text-pretty">{hint}</span>
      </CardContent>
    </Card>
  )
}

function InventoryRow({ entry }: { entry: PlatformInventoryEntry }) {
  return (
    <TableRow>
      <TableCell className="align-top">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{entry.label}</span>
          <code className="text-xs text-muted-foreground">{entry.table}</code>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <ProviderBadge provider={entry.provider} />
      </TableCell>
      <TableCell className="align-top text-sm text-muted-foreground">{entry.owner}</TableCell>
      <TableCell className="align-top text-right tabular-nums">
        {entry.rowCount.toLocaleString("en-US")}
      </TableCell>
      <TableCell className="align-top">
        <TableHealthBadge health={entry.health} />
      </TableCell>
      <TableCell className="align-top text-sm text-muted-foreground text-pretty">
        <div className="flex flex-col gap-1">
          <span>{entry.reason}</span>
          {entry.dependencies.length > 0 ? (
            <span className="text-xs">
              Depends on:{" "}
              {entry.dependencies.map((dep, index) => (
                <span key={dep}>
                  {index > 0 ? " → " : ""}
                  <code className="text-muted-foreground">{dep}</code>
                </span>
              ))}
            </span>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}

/**
 * Platform Inventory panel: a bucket summary followed by the full, table-by-table
 * classification. This is the on-screen twin of docs/PLATFORM_DATA_INVENTORY.md —
 * every table's owner, live row count, reconciled health, and the honest reason
 * behind that verdict (including why each empty table is legitimately empty).
 */
export function InventoryPanel({ inventory }: { inventory: PlatformInventory }) {
  const { entries, summary } = inventory
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {BUCKETS.map((bucket) => (
          <BucketTile
            key={bucket.key}
            count={summary[bucket.key]}
            health={bucket.health}
            label={bucket.label}
            hint={bucket.hint}
          />
        ))}
      </div>

      <Card className="gap-0 overflow-hidden">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Status &amp; Dependencies</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <InventoryRow key={entry.table} entry={entry} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
