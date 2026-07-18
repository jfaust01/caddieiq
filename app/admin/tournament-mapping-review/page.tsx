"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { TournamentCourseMapping } from "@/lib/generated/prisma/client"

export default function TournamentMappingReviewPage() {
  const [mappings, setMappings] = useState<TournamentCourseMapping[]>([])
  const [stats, setStats] = useState<{
    totalMappings: number
    averageConfidence: number
    autoVerifiedCount: number
    manualVerifiedCount: number
    pendingReviewCount: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMappings() {
      try {
        // Fetch low-confidence mappings
        const response = await fetch("/api/admin/tournament-mappings/low-confidence")
        if (!response.ok) throw new Error("Failed to fetch mappings")

        const data = await response.json()
        setMappings(data.mappings || [])
        setStats(data.stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    loadMappings()
  }, [])

  const handleApprove = async (tournamentId: string) => {
    try {
      const response = await fetch(
        `/api/admin/tournament-mappings/${tournamentId}/verify`,
        {
          method: "POST",
        }
      )
      if (!response.ok) throw new Error("Failed to verify mapping")

      // Remove from list
      setMappings((prev) => prev.filter((m) => m.tournamentId !== tournamentId))
    } catch (err) {
      console.error("Error approving mapping:", err)
    }
  }

  const handleReject = async (tournamentId: string) => {
    try {
      const response = await fetch(
        `/api/admin/tournament-mappings/${tournamentId}/reject`,
        {
          method: "POST",
        }
      )
      if (!response.ok) throw new Error("Failed to reject mapping")

      // Remove from list
      setMappings((prev) => prev.filter((m) => m.tournamentId !== tournamentId))
    } catch (err) {
      console.error("Error rejecting mapping:", err)
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

  if (loading) return <div className="p-8">Loading tournament mappings...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tournament Course Mapping Review</h1>
        <p className="text-muted-foreground">
          Verify and approve ambiguous tournament-to-course mappings
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
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageConfidence}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Auto-Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.autoVerifiedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Manual Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.manualVerifiedCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pendingReviewCount}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mappings List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Low-Confidence Mappings ({mappings.length})</h2>

        {mappings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No low-confidence mappings pending review!
            </CardContent>
          </Card>
        ) : (
          mappings.map((mapping) => (
            <Card key={mapping.tournamentId}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  {/* Tournament Info */}
                  <div>
                    <div className="text-sm text-muted-foreground">Tournament Course</div>
                    <div className="font-medium">{mapping.tournamentCourseName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {mapping.sportsDataIoCourseId}
                    </div>
                  </div>

                  {/* GolfCourseAPI Info */}
                  <div>
                    <div className="text-sm text-muted-foreground">GolfCourseAPI Course</div>
                    <div className="font-medium">{mapping.golfCourseCourseName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {mapping.golfCourseApiCourseId}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="text-sm text-muted-foreground">Confidence Score</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {mapping.matchConfidence}%
                      </Badge>
                    </div>
                    {mapping.confidenceReason && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {mapping.confidenceReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(mapping.tournamentId)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(mapping.tournamentId)}
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
