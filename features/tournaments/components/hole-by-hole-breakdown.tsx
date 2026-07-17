'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/shared/section-header'
import type { CourseHole as CourseHoleRecord } from '@/lib/generated/prisma/client'

interface HoleByHoleBreakdownProps {
  holes: CourseHoleRecord[]
}

/**
 * Calculate totals for a set of holes.
 */
function calculateTotals(holes: CourseHoleRecord[]) {
  const front9 = holes.slice(0, 9)
  const back9 = holes.slice(9, 18)

  return {
    front9Par: front9.reduce((sum, h) => sum + (h.par ?? 0), 0),
    back9Par: back9.reduce((sum, h) => sum + (h.par ?? 0), 0),
    totalPar: holes.reduce((sum, h) => sum + (h.par ?? 0), 0),
    front9Yardage: front9.reduce((sum, h) => sum + (h.yardage ?? 0), 0),
    back9Yardage: back9.reduce((sum, h) => sum + (h.yardage ?? 0), 0),
    totalYardage: holes.reduce((sum, h) => sum + (h.yardage ?? 0), 0),
    front9Handicap: front9.reduce((sum, h) => sum + (h.handicap ?? 0), 0),
    back9Handicap: back9.reduce((sum, h) => sum + (h.handicap ?? 0), 0),
    totalHandicap: holes.reduce((sum, h) => sum + (h.handicap ?? 0), 0),
  }
}

/**
 * Individual hole card component.
 */
function HoleCard({
  hole,
  isExpanded,
  onToggle,
}: {
  hole: CourseHoleRecord
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 text-left transition-colors hover:bg-accent"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Hole visualization */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl font-bold text-foreground">
                {hole.holeNumber}
              </div>
            </div>

            {/* Collapsed badges */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
                PAR {hole.par ?? '—'}
              </div>
              <div className="inline-flex items-center rounded-md bg-secondary/10 px-2 py-1 text-sm font-medium text-secondary">
                {hole.yardage ? `${hole.yardage} YDS` : '— YDS'}
              </div>
              {hole.handicap !== null && (
                <div className="inline-flex items-center rounded-md bg-accent/10 px-2 py-1 text-sm font-medium text-accent-foreground">
                  HDCP {hole.handicap}
                </div>
              )}
            </div>
          </div>

          {/* Expand/collapse icon */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="size-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-3">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">Hole Number</dt>
              <dd className="font-semibold text-foreground">{hole.holeNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">Par</dt>
              <dd className="font-semibold text-foreground">{hole.par ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">Yardage</dt>
              <dd className="font-semibold text-foreground">
                {hole.yardage ? `${hole.yardage.toLocaleString()} yards` : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">Stroke Index</dt>
              <dd className="font-semibold text-foreground">{hole.handicap ?? '—'}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}

/**
 * Hole-by-Hole Breakdown — interactive display of all 18 holes.
 * Features expandable cards, scorecard view, and summary information.
 */
export function HoleByHoleBreakdown({ holes }: HoleByHoleBreakdownProps) {
  const [expandedHoles, setExpandedHoles] = useState<Set<string>>(new Set())
  const sortedHoles = [...holes].sort((a, b) => a.holeNumber - b.holeNumber)
  const totals = calculateTotals(sortedHoles)

  const toggleHole = (holeId: string) => {
    const newExpanded = new Set(expandedHoles)
    if (newExpanded.has(holeId)) {
      newExpanded.delete(holeId)
    } else {
      newExpanded.add(holeId)
    }
    setExpandedHoles(newExpanded)
  }

  const expandAll = () => {
    setExpandedHoles(new Set(sortedHoles.map((h) => h.id)))
  }

  const collapseAll = () => {
    setExpandedHoles(new Set())
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Hole-by-Hole Breakdown"
        description="All 18 holes with yardage, par, and stroke indices"
      />

      {/* Scorecard */}
      <div className="overflow-x-auto">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Hole</TableHead>
              {sortedHoles.map((hole) => (
                <TableHead
                  key={hole.id}
                  className="w-12 text-center font-semibold"
                >
                  {hole.holeNumber}
                </TableHead>
              ))}
              <TableHead className="w-16 text-center font-semibold">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Par row */}
            <TableRow>
              <TableCell className="font-semibold">Par</TableCell>
              {sortedHoles.map((hole) => (
                <TableCell key={hole.id} className="text-center">
                  {hole.par ?? '—'}
                </TableCell>
              ))}
              <TableCell className="text-center font-semibold">
                {totals.totalPar}
              </TableCell>
            </TableRow>

            {/* Yardage row */}
            <TableRow>
              <TableCell className="font-semibold">Yardage</TableCell>
              {sortedHoles.map((hole) => (
                <TableCell key={hole.id} className="text-center text-xs">
                  {hole.yardage ? hole.yardage : '—'}
                </TableCell>
              ))}
              <TableCell className="text-center font-semibold">
                {totals.totalYardage.toLocaleString()}
              </TableCell>
            </TableRow>

            {/* Handicap row */}
            <TableRow>
              <TableCell className="font-semibold">Handicap</TableCell>
              {sortedHoles.map((hole) => (
                <TableCell key={hole.id} className="text-center">
                  {hole.handicap ?? '—'}
                </TableCell>
              ))}
              <TableCell className="text-center font-semibold">
                {totals.totalHandicap}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Front 9 / Back 9 Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Front 9</p>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Par:</dt>
              <dd className="font-semibold">{totals.front9Par}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Yardage:</dt>
              <dd className="font-semibold">{totals.front9Yardage.toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Back 9</p>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Par:</dt>
              <dd className="font-semibold">{totals.back9Par}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Yardage:</dt>
              <dd className="font-semibold">{totals.back9Yardage.toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Total</p>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Par:</dt>
              <dd className="font-semibold">{totals.totalPar}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Yardage:</dt>
              <dd className="font-semibold">{totals.totalYardage.toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Expand/Collapse buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>

      {/* Expandable hole cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sortedHoles.map((hole) => (
          <HoleCard
            key={hole.id}
            hole={hole}
            isExpanded={expandedHoles.has(hole.id)}
            onToggle={() => toggleHole(hole.id)}
          />
        ))}
      </div>
    </div>
  )
}
