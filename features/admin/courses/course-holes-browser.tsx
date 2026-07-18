"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, ChevronUp } from "lucide-react"

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
import { fetchCourseHoles } from "./actions"
import type { CourseHoleWithCourse } from "./actions"

export function CourseHolesBrowser() {
  const [holes, setHoles] = useState<CourseHoleWithCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedHole, setSelectedHole] = useState<CourseHoleWithCourse | null>(null)
  const [sortBy, setSortBy] = useState<"course" | "hole" | "par" | "yardage">("course")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    const loadHoles = async () => {
      try {
        setIsLoading(true)
        const data = await fetchCourseHoles({
          search: searchTerm || undefined,
          sortBy,
          sortDir,
        })
        setHoles(data)
      } catch (error) {
        console.error("[v0] Error loading holes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(loadHoles, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, sortBy, sortDir])

  const toggleSort = (field: "course" | "hole" | "par" | "yardage") => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDir("asc")
    }
  }

  const SortIcon = ({ field }: { field: "course" | "hole" | "par" | "yardage" }) => {
    if (sortBy !== field) return null
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 inline h-4 w-4" />
    )
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Course Data"
        title="Course Holes"
        description="Browse individual holes (18 per course) with filtering and sorting."
      />

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by course name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Badge variant="secondary">{holes.length} holes</Badge>
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
                  onClick={() => toggleSort("course")}
                >
                  Course <SortIcon field="course" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 select-none"
                  onClick={() => toggleSort("hole")}
                >
                  Hole # <SortIcon field="hole" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 select-none"
                  onClick={() => toggleSort("par")}
                >
                  Par <SortIcon field="par" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 select-none"
                  onClick={() => toggleSort("yardage")}
                >
                  Yardage <SortIcon field="yardage" />
                </TableHead>
                <TableHead>Handicap</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading holes...
                  </TableCell>
                </TableRow>
              ) : holes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No holes found
                  </TableCell>
                </TableRow>
              ) : (
                holes.map((hole) => (
                  <TableRow key={hole.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{hole.course.courseName}</TableCell>
                    <TableCell className="text-center font-medium">#{hole.holeNumber}</TableCell>
                    <TableCell className="text-center">{hole.par || "-"}</TableCell>
                    <TableCell className="text-right">{hole.yardage?.toLocaleString() || "-"}</TableCell>
                    <TableCell className="text-center">{hole.handicap || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedHole(hole)}
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
      <Sheet open={!!selectedHole} onOpenChange={(open) => !open && setSelectedHole(null)}>
        <SheetContent className="w-full max-w-xl">
          {selectedHole && (
            <>
              <SheetHeader>
                <SheetTitle>Hole #{selectedHole.holeNumber}</SheetTitle>
                <SheetDescription>
                  {selectedHole.course.courseName}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Course Info */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Course Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Course Name</p>
                      <p className="font-medium">{selectedHole.course.courseName}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">City, State</p>
                      <p className="font-medium">
                        {selectedHole.course.city}, {selectedHole.course.state}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Course Par</p>
                      <p className="font-medium">{selectedHole.course.par || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Hole Specifications */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Hole Specifications</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Hole Number</p>
                      <p className="font-medium text-lg">#{selectedHole.holeNumber}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Par</p>
                      <p className="font-medium text-lg">{selectedHole.par || "-"}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Yardage</p>
                      <p className="font-medium text-lg">{selectedHole.yardage?.toLocaleString() || "-"}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Handicap Index</p>
                      <p className="font-medium text-lg">{selectedHole.handicap || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Analysis */}
                {selectedHole.par && selectedHole.yardage && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Analysis</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <p className="text-muted-foreground">Yardage per Stroke</p>
                        <p className="font-medium">
                          {(selectedHole.yardage / selectedHole.par).toFixed(1)} yds/stroke
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-muted-foreground">Strokes to Par 72</p>
                        <p className="font-medium">
                          {(72 * selectedHole.yardage / (selectedHole.course.totalYardage || 6800)).toFixed(1)} strokes
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground border-t pt-4">
                  <p>Created: {new Date(selectedHole.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(selectedHole.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  )
}
