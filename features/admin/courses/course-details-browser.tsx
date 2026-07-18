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
import { fetchCourseDetails } from "./actions"
import type { CourseDetailWithRelations } from "./actions"

export function CourseDetailsBrowser() {
  const [courses, setCourses] = useState<CourseDetailWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<CourseDetailWithRelations | null>(null)
  const [sortBy, setSortBy] = useState<"name" | "par" | "yardage">("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true)
        const data = await fetchCourseDetails({
          search: searchTerm || undefined,
          sortBy,
          sortDir,
        })
        setCourses(data)
      } catch (error) {
        console.error("[v0] Error loading courses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(loadCourses, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, sortBy, sortDir])

  const toggleSort = (field: "name" | "par" | "yardage") => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDir("asc")
    }
  }

  const SortIcon = ({ field }: { field: "name" | "par" | "yardage" }) => {
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
        title="Course Details"
        description="Browse GolfCourseAPI course data with filtering and sorting. Click a course to view details."
      />

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by course name, city, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Badge variant="secondary">{courses.length} courses</Badge>
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
                  onClick={() => toggleSort("name")}
                >
                  Course Name <SortIcon field="name" />
                </TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
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
                <TableHead>Architect</TableHead>
                <TableHead>Year Built</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading courses...
                  </TableCell>
                </TableRow>
              ) : courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No courses found
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{course.courseName}</TableCell>
                    <TableCell>{course.city || "-"}</TableCell>
                    <TableCell>{course.state || "-"}</TableCell>
                    <TableCell>{course.par || "-"}</TableCell>
                    <TableCell>{course.totalYardage?.toLocaleString() || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{course.architect || "-"}</TableCell>
                    <TableCell>{course.yearBuilt || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCourse(course)}
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
      <Sheet open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <SheetContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCourse && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedCourse.courseName}</SheetTitle>
                <SheetDescription>
                  {selectedCourse.city}, {selectedCourse.state} {selectedCourse.country}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Club Name</p>
                      <p className="font-medium">{selectedCourse.clubName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">External ID</p>
                      <p className="font-mono text-xs">{selectedCourse.externalCourseId}</p>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Course Specifications</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Par</p>
                      <p className="font-medium">{selectedCourse.par || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Yardage</p>
                      <p className="font-medium">{selectedCourse.totalYardage?.toLocaleString() || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Course Rating</p>
                      <p className="font-medium">{selectedCourse.courseRating || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Slope Rating</p>
                      <p className="font-medium">{selectedCourse.slopeRating || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Metadata</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Architect</p>
                      <p className="font-medium">{selectedCourse.architect || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Year Built</p>
                      <p className="font-medium">{selectedCourse.yearBuilt || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Course Style</p>
                      <p className="font-medium">{selectedCourse.courseStyle || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Contact</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Website</p>
                      <p className="font-medium">
                        {selectedCourse.website ? (
                          <a href={selectedCourse.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {selectedCourse.website}
                          </a>
                        ) : (
                          "-"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedCourse.phone || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Playing Conditions */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Playing Conditions</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Fairway Grass</p>
                      <p className="font-medium">{selectedCourse.grassTypeFairway || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Green Grass</p>
                      <p className="font-medium">{selectedCourse.grassTypeGreen || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Green Size</p>
                      <p className="font-medium">{selectedCourse.greenSize || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Green Speed</p>
                      <p className="font-medium">{selectedCourse.greenSpeed || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Elevation</p>
                      <p className="font-medium">{selectedCourse.elevation ? `${selectedCourse.elevation} ft` : "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Facilities</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Driving Range</p>
                      <Badge variant={selectedCourse.drivingRange ? "default" : "secondary"}>
                        {selectedCourse.drivingRange ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Putting Green</p>
                      <Badge variant={selectedCourse.puttingGreen ? "default" : "secondary"}>
                        {selectedCourse.puttingGreen ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Short Game Area</p>
                      <Badge variant={selectedCourse.shortGameArea ? "default" : "secondary"}>
                        {selectedCourse.shortGameArea ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Related Data */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Related Data</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Holes</p>
                      <p className="font-medium">{selectedCourse.holes?.length || 0}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Tees</p>
                      <p className="font-medium">{selectedCourse.tees?.length || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground border-t pt-4">
                  <p>Created: {new Date(selectedCourse.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(selectedCourse.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  )
}
