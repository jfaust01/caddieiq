'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Search,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SkeletonTable } from '@/components/loaders/skeleton-table'
import { cn } from '@/lib/utils'

interface Tournament {
  id: string
  name: string
}

interface ImportResult {
  success: boolean
  tournamentId: string
  providerTournamentId: number | null
  playersProcessed: number
  roundsProcessed: number
  holesInserted: number
  holesUpdated: number
  playersUnmatched: Array<{ playerId: number; name: string }>
  errors: Array<{ error: string; playerRoundId?: string }>
}

interface CoverageResult {
  tournamentId: string
  coverage: {
    complete: number
    partial: number
    missing: number
    total: number
    expectedHolesPerPlayer: number
  }
}

interface PlayerDiagnostic {
  playerId: string
  playerName: string
  sdioPlayerId: number | null
  internalPlayerId: string
  tournamentFieldId: string | null
  sourceRecordId: string | null
  matchStatus: 'matched' | 'unmatched' | 'no_field_data'
  r1Holes: number
  r2Holes: number
  r3Holes: number
  r4Holes: number
  totalHoles: number
  playerRoundIds: string[]
  importedAt: string | null
  status: 'complete' | 'partial' | 'no_hole_data' | 'import_error'
}

interface HoleScoreDiagnostics {
  tournament: {
    id: string
    name: string
    externalId: number | null
  }
  summary: {
    providerPlayersReturned: number
    playersMatched: number
    playersUnmatched: number
    roundsProcessed: number
    holesInserted: number
    holesUpdated: number
    totalPersistedHoleRows: number
    coveragePercentage: number
  }
  players: PlayerDiagnostic[]
  lastImportedAt: string | null
}

type FilterStatus = 'all' | 'complete' | 'partial' | 'unmatched' | 'no_hole_data' | 'error'

export function HoleScoreImportClient({ tournaments }: { tournaments: Tournament[] }) {
  const [selectedTournament, setSelectedTournament] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastImportTime, setLastImportTime] = useState<string | null>(null)

  // Diagnostics
  const [diagnostics, setDiagnostics] = useState<HoleScoreDiagnostics | null>(null)
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

  const loadDiagnostics = async (tournamentId: string) => {
    if (!tournamentId) return
    setLoadingDiagnostics(true)
    try {
      const response = await fetch(`/api/admin/hole-scores-diagnostics?tournamentId=${tournamentId}`)
      if (response.ok) {
        setDiagnostics(await response.json())
      }
    } catch (err) {
      console.error('[v0] Failed to load diagnostics:', err)
    } finally {
      setLoadingDiagnostics(false)
    }
  }

  // Load diagnostics when tournament changes
  useEffect(() => {
    if (selectedTournament) {
      loadDiagnostics(selectedTournament)
    }
  }, [selectedTournament])

  const handleImport = async () => {
    if (!selectedTournament) {
      setError('Please select a tournament')
      return
    }

    setImporting(true)
    setError(null)
    setImportResult(null)

    try {
      const response = await fetch('/api/admin/import-hole-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: selectedTournament }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Import failed')
        return
      }

      setImportResult(data)
      setLastImportTime(new Date().toLocaleString())

      // Refresh diagnostics
      await loadDiagnostics(selectedTournament)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const filteredPlayers = useMemo(() => {
    if (!diagnostics) return []
    return diagnostics.players
      .filter((p) => {
        // Search filter
        if (
          searchQuery &&
          !p.playerName.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false
        }
        // Status filter
        if (filterStatus !== 'all' && p.status !== filterStatus) {
          return false
        }
        return true
      })
      .sort((a, b) => a.playerName.localeCompare(b.playerName))
  }, [diagnostics, searchQuery, filterStatus])

  const statusStats = useMemo(() => {
    if (!diagnostics) return { complete: 0, partial: 0, unmatched: 0, no_hole_data: 0, error: 0 }
    return diagnostics.players.reduce(
      (acc, p) => {
        acc[p.status as 'complete' | 'partial' | 'unmatched' | 'no_hole_data' | 'error']++
        return acc
      },
      { complete: 0, partial: 0, unmatched: 0, no_hole_data: 0, error: 0 },
    )
  }, [diagnostics])

  const handleCheckCoverage = async () => {
    if (!selectedTournament) {
      setError('Please select a tournament')
      return
    }

    setChecking(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/import-hole-scores/status?tournamentId=${selectedTournament}`,
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Coverage check failed')
        return
      }

      setCoverageResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coverage check failed')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Import Hole Scores</CardTitle>
              <CardDescription>Import hole-by-hole scorecard data from SportsDataIO</CardDescription>
            </div>
            <Badge variant="outline" className="h-fit">
              SportsDataIO
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tournament Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tournament</label>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger>
                <SelectValue placeholder="Select tournament..." />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={importing || !selectedTournament}
              className="gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Import Hole Scores
                </>
              )}
            </Button>

            <Button
              onClick={handleCheckCoverage}
              disabled={checking || !selectedTournament}
              variant="outline"
              className="gap-2"
            >
              {checking ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Coverage'
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex gap-2 items-start">
              <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Last Import Time */}
          {lastImportTime && (
            <div className="text-xs text-muted-foreground">Last import: {lastImportTime}</div>
          )}
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card className={importResult.success ? 'border-green-500/50' : 'border-red-500/50'}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="size-5 text-green-600" />
              ) : (
                <AlertCircle className="size-5 text-red-600" />
              )}
              <CardTitle className="text-lg">
                {importResult.success ? 'Import Complete' : 'Import Failed'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs text-muted-foreground">Players Processed</div>
                <div className="text-2xl font-bold">{importResult.playersProcessed}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Rounds Processed</div>
                <div className="text-2xl font-bold">{importResult.roundsProcessed}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Holes Inserted</div>
                <div className="text-2xl font-bold text-green-600">{importResult.holesInserted}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Holes Updated</div>
                <div className="text-2xl font-bold text-blue-600">{importResult.holesUpdated}</div>
              </div>
            </div>

            {/* Unmatched Players */}
            {importResult.playersUnmatched.length > 0 && (
              <div className="rounded-lg bg-yellow-500/10 p-3">
                <div className="text-sm font-medium text-yellow-900 mb-2">
                  {importResult.playersUnmatched.length} Unmatched Players
                </div>
                <ul className="text-xs space-y-1 text-yellow-800">
                  {importResult.playersUnmatched.map((p) => (
                    <li key={p.playerId}>
                      • {p.name} (ID: {p.playerId})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Errors */}
            {importResult.errors.length > 0 && (
              <div className="rounded-lg bg-red-500/10 p-3">
                <div className="text-sm font-medium text-red-900 mb-2">
                  {importResult.errors.length} Errors
                </div>
                <ul className="text-xs space-y-1 text-red-800">
                  {importResult.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>• {e.error}</li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li>... and {importResult.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Coverage Results */}
      {coverageResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hole Score Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Complete Players</div>
                <div className="text-2xl font-bold text-green-600">
                  {coverageResult.coverage.complete}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Partial Players</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {coverageResult.coverage.partial}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Missing Players</div>
                <div className="text-2xl font-bold text-red-600">
                  {coverageResult.coverage.missing}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Players</div>
                <div className="text-2xl font-bold">{coverageResult.coverage.total}</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Expected holes per player: {coverageResult.coverage.expectedHolesPerPlayer}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostics Summary */}
      {selectedTournament && diagnostics && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Import Summary Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Players Matched</div>
                  <div className="text-xl font-bold text-emerald-600">
                    {diagnostics.summary.playersMatched}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Unmatched</div>
                  <div className="text-xl font-bold text-amber-600">
                    {diagnostics.summary.playersUnmatched}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Coverage %</div>
                  <div className="text-xl font-bold">
                    {diagnostics.summary.coveragePercentage}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Total Holes</div>
                  <div className="text-xl font-bold text-blue-600">
                    {diagnostics.summary.totalPersistedHoleRows}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Empty States */}
          {selectedTournament && !loadingDiagnostics && diagnostics.players.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <AlertCircle className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {diagnostics.summary.playersMatched === 0
                    ? 'No SportsDataIO player mappings were found for this tournament'
                    : 'No persisted hole-score data is available'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Player Diagnostics Table */}
          {selectedTournament && diagnostics.players.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>Player Import Details</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'complete', 'partial', 'unmatched', 'no_hole_data'] as const).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={cn(
                            'text-xs px-2.5 py-1 rounded-full transition-colors',
                            filterStatus === status
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80',
                          )}
                        >
                          {status === 'all'
                            ? 'All'
                            : status === 'complete'
                              ? 'Complete'
                              : status === 'partial'
                                ? 'Partial'
                                : status === 'unmatched'
                                  ? 'Unmatched'
                                  : 'No Data'}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {loadingDiagnostics ? (
                  <SkeletonTable rows={5} columns={9} />
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-8"></TableHead>
                          <TableHead className="font-semibold">Player</TableHead>
                          <TableHead className="text-center">Match</TableHead>
                          <TableHead className="text-center">R1</TableHead>
                          <TableHead className="text-center">R2</TableHead>
                          <TableHead className="text-center">R3</TableHead>
                          <TableHead className="text-center">R4</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPlayers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                              No players match the current filters
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredPlayers.map((player) => (
                            <TableRow
                              key={player.playerId}
                              className="cursor-pointer"
                              onClick={() =>
                                setExpandedPlayer(
                                  expandedPlayer === player.playerId ? null : player.playerId,
                                )
                              }
                            >
                              <TableCell className="w-8">
                                <ChevronDown
                                  className={cn(
                                    'size-4 transition-transform',
                                    expandedPlayer === player.playerId && 'rotate-180',
                                  )}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{player.playerName}</TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    player.sourceRecordId ? 'bg-emerald-500/10' : 'bg-amber-500/10',
                                  )}
                                >
                                  {player.sourceRecordId ? '✓' : '—'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {player.r1Holes || '—'}
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {player.r2Holes || '—'}
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {player.r3Holes || '—'}
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {player.r4Holes || '—'}
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {player.totalHoles}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  className={cn(
                                    'text-xs',
                                    player.status === 'complete' && 'bg-emerald-500/20 text-emerald-700',
                                    player.status === 'partial' && 'bg-amber-500/20 text-amber-700',
                                    player.status === 'no_hole_data' &&
                                      'bg-slate-500/20 text-slate-700',
                                    player.status === 'unmatched' && 'bg-red-500/20 text-red-700',
                                  )}
                                  variant="outline"
                                >
                                  {player.status === 'complete'
                                    ? 'Complete'
                                    : player.status === 'partial'
                                      ? 'Partial'
                                      : player.status === 'no_hole_data'
                                        ? 'No Data'
                                        : 'Unmatched'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Expanded Player Details */}
          {expandedPlayer && diagnostics && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">
                  {
                    diagnostics.players.find((p) => p.playerId === expandedPlayer)?.playerName
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {(() => {
                    const player = diagnostics.players.find((p) => p.playerId === expandedPlayer)
                    if (!player) return null
                    return (
                      <>
                        <div>
                          <div className="text-xs text-muted-foreground">SportsDataIO Player ID</div>
                          <div className="font-mono">{player.sdioPlayerId || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Internal Player ID</div>
                          <div className="font-mono text-xs">{player.internalPlayerId}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">TournamentField ID</div>
                          <div className="font-mono text-xs">{player.tournamentFieldId || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">sourceRecordId</div>
                          <div className="font-mono">{player.sourceRecordId || 'NULL'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Match Status</div>
                          <Badge>{player.matchStatus}</Badge>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Last Updated</div>
                          <div className="text-xs">
                            {player.importedAt
                              ? new Date(player.importedAt).toLocaleString()
                              : 'Never'}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Tournament Selected */}
      {!selectedTournament && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select a tournament to view hole-score coverage
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
