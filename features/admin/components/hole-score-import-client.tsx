'use client'

import { useState } from 'react'
import { Loader2, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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

export function HoleScoreImportClient({ tournaments }: { tournaments: Tournament[] }) {
  const [selectedTournament, setSelectedTournament] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastImportTime, setLastImportTime] = useState<string | null>(null)

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

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
    </div>
  )
}
