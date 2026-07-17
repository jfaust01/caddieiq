"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { importHistoricalResultsAction } from "./actions/import-historical-results"
import type { HistoricalResultsImportSummary } from "@/lib/imports/historical-results-import"

export function ImportHistoricalResults() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    summary: HistoricalResultsImportSummary
    error?: string
  } | null>(null)

  async function handleImport() {
    setIsLoading(true)
    setResult(null)

    try {
      const res = await importHistoricalResultsAction()
      if (res.success && res.summary) {
        setResult({ summary: res.summary })
      } else {
        setResult({ summary: null as any, error: res.error })
      }
    } catch (error) {
      setResult({
        summary: null as any,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <h3 className="font-semibold">Historical Results Import</h3>
        <p className="text-sm text-muted-foreground">
          Import tournament rounds and player scores from historical leaderboards
        </p>
      </div>

      <Button onClick={handleImport} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Importing...
          </>
        ) : (
          "Start Import"
        )}
      </Button>

      {result && (
        <div className="space-y-2 rounded bg-muted p-3 text-sm">
          {result.error ? (
            <>
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="size-4" />
                <span className="font-semibold">Import Failed</span>
              </div>
              <p>{result.error}</p>
            </>
          ) : result.summary ? (
            <>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="size-4" />
                <span className="font-semibold">Import Complete</span>
              </div>
              <dl className="grid gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Tournaments Considered:</span>
                  <span className="font-mono font-semibold">
                    {result.summary.tournamentsConsidered}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>With Leaderboard:</span>
                  <span className="font-mono font-semibold">
                    {result.summary.tournamentsWithLeaderboard}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rounds Created:</span>
                  <span className="font-mono font-semibold">
                    {result.summary.roundsCreated}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Player Rounds Created:</span>
                  <span className="font-mono font-semibold">
                    {result.summary.playerRoundsCreated}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Player Rounds Updated:</span>
                  <span className="font-mono font-semibold">
                    {result.summary.playerRoundsUpdated}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Player Rounds Failed:</span>
                  <span className="font-mono font-semibold">
                    {result.summary.playerRoundsFailed}
                  </span>
                </div>
              </dl>
              {result.summary.notes.length > 0 && (
                <div className="mt-2 border-t border-border pt-2">
                  <p className="text-xs font-semibold">Notes:</p>
                  <ul className="list-inside list-disc space-y-1">
                    {result.summary.notes.slice(0, 5).map((note, i) => (
                      <li key={i} className="text-xs">
                        {note}
                      </li>
                    ))}
                    {result.summary.notes.length > 5 && (
                      <li className="text-xs">
                        ... and {result.summary.notes.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
