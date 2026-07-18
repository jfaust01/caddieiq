"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { TournamentCourseMapping } from "@/lib/generated/prisma/client"

export default function TournamentMappingReviewPage() {
  const [mappings, setMappings] = useState<TournamentCourseMapping[]>([])
  const [stats, setStats] = useState<{
    totalMappings: number
    verifiedCount: number
    pendingReviewCount: number
    rejectedCount: number
    averageConfidence: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [actionInProgress, setActionInProgress] = useState(false)

  useEffect(() => {
    loadMappings()
  }, [])

  const loadMappings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/tournament-mappings/low-confidence")
      if (!response.ok) throw new Error("Failed to fetch mappings")

      const data = await response.json()
      setMappings(data.mappings || [])
      setStats(data.stats)
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(mappings.map((m) => m.tournamentId)))
    } else {
      setSelected(new Set())
    }
  }

  const handleSelectMapping = (tournamentId: string, checked: boolean) => {
    const newSelected = new Set(selected)
    if (checked) {
      newSelected.add(tournamentId)
    } else {
      newSelected.delete(tournamentId)
    }
    setSelected(newSelected)
  }

  const handleBulkVerify = async () => {
    if (selected.size === 0) return
    try {
      setActionInProgress(true)
      const response = await fetch("/api/admin/tournament-mappings/bulk-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentIds: Array.from(selected) }),
      })
      if (!response.ok) throw new Error("Failed to verify mappings")

      // Reload mappings
      await loadMappings()
    } catch (err) {
      console.error("Error verifying mappings:", err)
    } finally {
      setActionInProgress(false)
    }
  }

  const handleBulkReject = async () => {
    if (selected.size === 0) return
    try {
      setActionInProgress(true)
      const response = await fetch("/api/admin/tournament-mappings/bulk-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentIds: Array.from(selected),
          reason: "Rejected via bulk action",
        }),
      })
      if (!response.ok) throw new Error("Failed to reject mappings")

      // Reload mappings
      await loadMappings()
    } catch (err) {
      console.error("Error rejecting mappings:", err)
    } finally {
      setActionInProgress(false)
    }
  }

  const handleBulkSearchAgain = async () => {
    if (selected.size === 0) return
    try {
      setActionInProgress(true)
      const response = await fetch("/api/admin/tournament-mappings/bulk-search-again", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentIds: Array.from(selected) }),
      })
      if (!response.ok) throw new Error("Failed to mark mappings for re-search")

      // Reload mappings
      await loadMappings()
    } catch (err) {
      console.error("Error marking for re-search:", err)
    } finally {
      setActionInProgress(false)
    }
  }

  const handleIndividualVerify = async (tournamentId: string) => {
    try {
      const response = await fetch(
        `/api/admin/tournament-mappings/${tournamentId}/verify`,
        { method: "POST" }
      )
      if (!response.ok) throw new Error("Failed to verify mapping")
      setMappings((prev) => prev.filter((m) => m.tournamentId !== tournamentId))
    } catch (err) {
      console.error("Error verifying mapping:", err)
    }
  }

  const handleIndividualReject = async (tournamentId: string) => {
    try {
      const response = await fetch(
        `/api/admin/tournament-mappings/${tournamentId}/reject`,
        { method: "POST" }
      )
      if (!response.ok) throw new Error("Failed to reject mapping")
      setMappings((prev) => prev.filter((m) => m.tournamentId !== tournamentId))
    } catch (err) {
      console.error("Error rejecting mapping:", err)
    }
  }

  const handleIndividualSearchAgain = async (tournamentId: string) => {
    try {
      const response = await fetch(
        `/api/admin/tournament-mappings/${tournamentId}/search-again`,
        { method: "POST" }
      )
      if (!response.ok) throw new Error("Failed to mark for re-search")
      setMappings((prev) => prev.filter((m) => m.tournamentId !== tournamentId))
    } catch (err) {
      console.error("Error marking for re-search:", err)
    }
  }

  const getConfidenceColor = (score: number | null) => {
    if (!score) return "gray"
    if (score >= 95) return "green"
    if (score >= 80) return "blue"
    if (score >= 60) return "yellow"
    if (score >= 40) return "orange"
    return "red"
  }

  const getConfidenceBadgeVariant = (score: number | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!score) return "outline"
    if (score >= 95) return "default"
    if (score >= 80) return "secondary"
    return "destructive"
  }

  if (loading) return <div className="p-8">Loading tournament mappings...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tournament Course Mapping Review</h1>
        <p className="text-muted-foreground">
          Review mappings by confidence score. Auto-recommended actions based on confidence thresholds.
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMappings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.verifiedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviewCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejectedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageConfidence}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Actions */}
      {mappings.length > 0 && (
        <Card className="bg-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Bulk Actions ({selected.size} selected)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="default"
              onClick={handleBulkVerify}
              disabled={selected.size === 0 || actionInProgress}
            >
              Verify Selected ({selected.size})
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkReject}
              disabled={selected.size === 0 || actionInProgress}
            >
              Reject Selected ({selected.size})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkSearchAgain}
              disabled={selected.size === 0 || actionInProgress}
            >
              Search Again ({selected.size})
            </Button>
            {selected.size > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
              >
                Clear Selection
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mappings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Pending Mappings ({mappings.length})
          </h2>
          {mappings.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selected.size === mappings.length && mappings.length > 0}
                onCheckedChange={(checked) => handleSelectAll(!!checked)}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          )}
        </div>

        {mappings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No pending mappings! All courses have been verified or rejected.
            </CardContent>
          </Card>
        ) : (
          mappings.map((mapping) => (
            <Card key={mapping.tournamentId}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                  {/* Checkbox */}
                  <div className="flex items-start pt-1">
                    <Checkbox
                      checked={selected.has(mapping.tournamentId)}
                      onCheckedChange={(checked) =>
                        handleSelectMapping(mapping.tournamentId, !!checked)
                      }
                    />
                  </div>

                  {/* Tournament Info */}
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold">TOURNAMENT</div>
                    <div className="font-medium text-sm">{mapping.tournamentCourseName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {mapping.sportsDataIoCourseId}
                    </div>
                  </div>

                  {/* GolfCourseAPI Info */}
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold">GOLFCOURSEAPI</div>
                    <div className="font-medium text-sm">{mapping.golfCourseCourseName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {mapping.golfCourseApiCourseId}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold">CONFIDENCE</div>
                    <div className="mt-1">
                      <Badge
                        variant={getConfidenceBadgeVariant(mapping.matchConfidence)}
                        className="mb-2"
                      >
                        {mapping.matchConfidence}%
                      </Badge>
                    </div>
                    {mapping.matchConfidence && mapping.matchConfidence >= 95 && (
                      <Badge variant="outline" className="text-xs">
                        Recommend Verify
                      </Badge>
                    )}
                    {mapping.matchConfidence &&
                      mapping.matchConfidence >= 80 &&
                      mapping.matchConfidence < 95 && (
                        <Badge variant="secondary" className="text-xs">
                          Needs Review
                        </Badge>
                      )}
                    {mapping.matchConfidence && mapping.matchConfidence < 80 && (
                      <Badge variant="destructive" className="text-xs">
                        Low Confidence
                      </Badge>
                    )}
                    {mapping.confidenceReason && (
                      <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {mapping.confidenceReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleIndividualVerify(mapping.tournamentId)}
                      disabled={actionInProgress}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleIndividualSearchAgain(mapping.tournamentId)}
                      disabled={actionInProgress}
                    >
                      Search Again
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleIndividualReject(mapping.tournamentId)}
                      disabled={actionInProgress}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
