"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, ChevronUp, Check, X } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { PageShell } from "@/components/shared/page-shell"
import { Button } from "@/components/ui/button"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { fetchTournamentMappings, toggleMappingVerification } from "./actions"
import type { TournamentMappingWithDetails } from "./actions"

export function TournamentCourseMappingBrowser() {
  const [mappings, setMappings] = useState<TournamentMappingWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all")
  const [selectedMapping, setSelectedMapping] = useState<TournamentMappingWithDetails | null>(null)
  const [sortBy, setSortBy] = useState<"tournament" | "confidence" | "updated">("tournament")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const loadMappings = async () => {
      try {
        setIsLoading(true)
        const data = await fetchTournamentMappings({
          search: searchTerm || undefined,
          verified: verifiedFilter === "verified" ? true : verifiedFilter === "unverified" ? false : undefined,
          sortBy,
          sortDir,
        })
        setMappings(data)
      } catch (error) {
        console.error("[v0] Error loading mappings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(loadMappings, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, verifiedFilter, sortBy, sortDir])

  const toggleSort = (field: "tournament" | "confidence" | "updated") => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDir("asc")
    }
  }

  const handleToggleVerification = async (mappingId: string, currentState: boolean) => {
    setIsUpdating(true)
    try {
      await toggleMappingVerification(mappingId, !currentState)
      // Update local state
      setMappings(mappings.map(m => m.id === mappingId ? { ...m, verified: !currentState } : m))
      if (selectedMapping?.id === mappingId) {
        setSelectedMapping({ ...selectedMapping, verified: !currentState })
      }
    } catch (error) {
      console.error("[v0] Error toggling verification:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const SortIcon = ({ field }: { field: "tournament" | "confidence" | "updated" }) => {
    if (sortBy !== field) return null
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 inline h-4 w-4" />
    )
  }

  const confidenceBadge = (score: number | null) => {
    if (!score) return <Badge variant="outline">Unknown</Badge>
    if (score >= 90) return <Badge className="bg-green-600">Excellent</Badge>
    if (score >= 75) return <Badge className="bg-blue-600">Good</Badge>
    if (score >= 50) return <Badge className="bg-yellow-600">Fair</Badge>
    return <Badge className="bg-red-600">Poor</Badge>
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Course Data"
        title="Tournament Course Mappings"
        description="Manage the link between tournaments and GolfCourseAPI courses."
      />

      {/* Filters */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by tournament or course name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Badge variant="secondary">{mappings.length} mappings</Badge>
        </div>
        
        <div className="flex gap-2">
          {(["all", "verified", "unverified"] as const).map((filter) => (
            <Button
              key={filter}
              variant={verifiedFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setVerifiedFilter(filter)}
            >
              {filter === "all" && "All"}
              {filter === "verified" && `✓ Verified`}
              {filter === "unverified" && `✗ Unverified`}
            </Button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 select-none"
                  onClick={() => toggleSort("tournament")}
                >
                  Tournament <SortIcon field="tournament" />
                </TableHead>
                <TableHead>GolfCourseAPI Course</TableHead>
                <TableHead>Method</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 select-none"
                  onClick={() => toggleSort("confidence")}
                >
                  Confidence <SortIcon field="confidence" />
                </TableHead>
                <TableHead className="text-center">Verified</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 select-none"
                  onClick={() => toggleSort("updated")}
                >
                  Updated <SortIcon field="updated" />
                </TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading mappings...
                  </TableCell>
                </TableRow>
              ) : mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No mappings found
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((mapping) => (
                  <TableRow key={mapping.id} className={mapping.verified ? "bg-green-50 dark:bg-green-950/20" : "hover:bg-muted/50"}>
                    <TableCell className="font-medium">{mapping.tournamentCourseName || "—"}</TableCell>
                    <TableCell className="font-medium">{mapping.golfCourseCourseName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {mapping.matchedBy || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {confidenceBadge(mapping.matchConfidence)}
                      {mapping.matchConfidence && <span className="ml-2 text-xs text-muted-foreground">{mapping.matchConfidence}%</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {mapping.verified ? (
                        <Check className="h-5 w-5 text-green-600 inline" />
                      ) : (
                        <X className="h-5 w-5 text-red-600 inline" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {mapping.updatedAt ? new Date(mapping.updatedAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMapping(mapping)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedMapping} onOpenChange={(open) => !open && setSelectedMapping(null)}>
        <SheetContent className="w-full max-w-xl">
          {selectedMapping && (
            <>
              <SheetHeader>
                <SheetTitle>Mapping Details</SheetTitle>
                <SheetDescription>
                  {selectedMapping.tournamentCourseName} → {selectedMapping.golfCourseCourseName}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Tournament Info */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Tournament Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tournament ID</p>
                      <p className="font-mono text-xs">{selectedMapping.tournamentId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Course Name</p>
                      <p className="font-medium">{selectedMapping.tournamentCourseName || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* GolfCourseAPI Info */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">GolfCourseAPI Mapping</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">GolfCourseAPI ID</p>
                      <p className="font-mono text-xs">{selectedMapping.golfCourseApiCourseId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Course Name</p>
                      <p className="font-medium">{selectedMapping.golfCourseCourseName || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Matching Metadata */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Matching Metadata</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Method</p>
                      <Badge variant="outline">{selectedMapping.matchedBy || "unknown"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Confidence Score</p>
                      <div className="text-right">
                        {confidenceBadge(selectedMapping.matchConfidence)}
                        {selectedMapping.matchConfidence && <p className="text-xs text-muted-foreground">{selectedMapping.matchConfidence}%</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-sm mb-3">Verification Status</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium">
                        {selectedMapping.verified ? "✓ Verified" : "✗ Not Verified"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedMapping.verified 
                          ? "This mapping has been reviewed and approved" 
                          : "This mapping awaits admin review"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={selectedMapping.verified ? "destructive" : "default"}
                    className="w-full"
                    onClick={() => handleToggleVerification(selectedMapping.id, selectedMapping.verified)}
                    disabled={isUpdating}
                  >
                    {isUpdating 
                      ? "Updating..." 
                      : selectedMapping.verified 
                        ? "Mark as Unverified" 
                        : "Mark as Verified"}
                  </Button>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground border-t pt-4">
                  <p>Created: {new Date(selectedMapping.createdAt).toLocaleString()}</p>
                  <p>Last synced: {selectedMapping.lastSyncedAt ? new Date(selectedMapping.lastSyncedAt).toLocaleString() : "Never"}</p>
                  <p>Updated: {new Date(selectedMapping.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  )
}
