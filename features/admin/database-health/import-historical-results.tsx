"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { importHistoricalResultsAction } from "./actions/import-historical-results"
import type { HistoricalResultsImportSummary } from "@/lib/imports/historical-results-import"
import type { ImportHistoricalResultsResponse } from "./actions/import-historical-results"

export function ImportHistoricalResults() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImportHistoricalResultsResponse | null>(null)
  const [showStackTrace, setShowStackTrace] = useState(false)

  async function handleImport() {
    setIsLoading(true)
    setResult(null)
    setShowStackTrace(false)

    try {
      const res = await importHistoricalResultsAction()
      setResult(res)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      const stack = error instanceof Error ? error.stack : undefined
      setResult({
        success: false,
        error: message,
        stack,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="w-full border-4 border-red-600 bg-red-500 p-4">
        <div className="text-center text-2xl font-bold text-white">
          🚨 DEBUG: ImportHistoricalResults component is rendering 🚨
        </div>
      </div>
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
          {!result.success ? (
            <>
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="size-4" />
                <span className="font-semibold">Import Failed</span>
              </div>
              <p className="text-sm">{result.error}</p>
              {result.stack && (
                <div className="mt-2 border-t border-red-200 pt-2">
                  <button
                    onClick={() => setShowStackTrace(!showStackTrace)}
                    className="flex items-center gap-1 text-xs font-mono text-red-600 hover:text-red-700"
                  >
                    {showStackTrace ? (
                      <ChevronUp className="size-3" />
                    ) : (
                      <ChevronDown className="size-3" />
                    )}
                    {showStackTrace ? "Hide Stack Trace" : "Show Stack Trace"}
                  </button>
                  {showStackTrace && (
                    <pre className="mt-1 overflow-x-auto rounded bg-red-50 p-2 text-xs text-red-900">
                      {result.stack}
                    </pre>
                  )}
                </div>
              )}
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
    </div>
  )
}
