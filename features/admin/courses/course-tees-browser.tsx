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
import { fetchCourseTees } from "./actions"
import type { CourseTeeWithCourse } from "./actions"

export function CourseTeesBrowser() {
  const [tees, setTees] = useState<CourseTeeWithCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTee, setSelectedTee] = useState<CourseTeeWithCourse | null>(null)
  const [sortBy, setSortBy] = useState<"course" | "name" | "yardage" | "rating">("course")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    const loadTees = async () => {
      try {
        setIsLoading(true)
        const data = await fetchCourseTees({
          search: searchTerm || undefined,
          sortBy,
          sortDir,
        })
        setTees(data)
      } catch (error) {
        console.error("[v0] Error loading tees:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(loadTees, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, sortBy, sortDir])

  const toggleSort = (field: "course" | "name" | "yardage" | "rating") => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDir("asc")
    }
  }

  const SortIcon = ({ field }: { field: "course" | "name" | "yardage" | "rating" }) => {
    if (sortBy !== field) return null
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 inline h-4 w-4" />
    )
  }

  const getTeeColorBadge = (color: string | null) => {
    if (!color) return <Badge variant="outline">Unknown</Badge>
    const colorLower = color.toLowerCase()
    if (colorLower.includes("blue")) return <Badge className="bg-blue-500">Blue</Badge>
    if (colorLower.includes("white")) return <Badge className="bg-gray-300 text-black">White</Badge>
    if (colorLower.includes("red")) return <Badge className="bg-red-500">Red</Badge>
    if (colorLower.includes("gold")) return <Badge className="bg-yellow-500 text-black">Gold</Badge>
    if (colorLower.includes("black")) return <Badge className="bg-black">Black</Badge>
    return <Badge variant="outline">{color}</Badge>
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Course Data"
        title="Course Tees"
        description="Browse tee boxes (3-6 per course) with filtering and sorting."
      />

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by course name or tee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Badge variant="secondary">{tees.length} tees</Badge>
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
                  onClick={() => toggleSort("name")}
                >
                  Tee Name <SortIcon field="name" />
                </TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 select-none"
                  onClick={() => toggleSort("yardage")}
                >
                  Yardage <SortIcon field="yardage" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/70 select-none"
                  onClick={() => toggleSort("rating")}
                >
                  Rating <SortIcon field="rating" />
                </TableHead>
                <TableHead>Slope</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading tees...
                  </TableCell>
                </TableRow>
              ) : tees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No tees found
                  </TableCell>
                </TableRow>
              ) : (
                tees.map((tee) => (
                  <TableRow key={tee.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{tee.course.courseName}</TableCell>
                    <TableCell className="font-medium">{tee.teeName}</TableCell>
                    <TableCell>{getTeeColorBadge(tee.teeColor)}</TableCell>
                    <TableCell className="text-center">{tee.gender || "-"}</TableCell>
                    <TableCell className="text-right">{tee.yardage?.toLocaleString() || "-"}</TableCell>
                    <TableCell className="text-center">{tee.rating?.toFixed(1) || "-"}</TableCell>
                    <TableCell className="text-center">{tee.slope || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTee(tee)}
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
      <Sheet open={!!selectedTee} onOpenChange={(open) => !open && setSelectedTee(null)}>
        <SheetContent className="w-full max-w-xl">
          {selectedTee && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTee.teeName} Tee</SheetTitle>
                <SheetDescription>
                  {selectedTee.course.courseName}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Course Info */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Course Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Course Name</p>
                      <p className="font-medium">{selectedTee.course.courseName}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">City, State</p>
                      <p className="font-medium">
                        {selectedTee.course.city}, {selectedTee.course.state}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tee Specifications */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Tee Specifications</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Tee Name</p>
                      <p className="font-medium text-base">{selectedTee.teeName}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Color</p>
                      <div>{getTeeColorBadge(selectedTee.teeColor)}</div>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-medium">{selectedTee.gender || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Scoring */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Scoring & Handicap</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Yardage</p>
                      <p className="font-medium text-lg">{selectedTee.yardage?.toLocaleString() || "-"}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Course Rating</p>
                      <p className="font-medium text-lg">{selectedTee.rating?.toFixed(1) || "-"}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Slope Rating</p>
                      <p className="font-medium text-lg">{selectedTee.slope || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Analysis */}
                {selectedTee.yardage && selectedTee.rating && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Analysis</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <p className="text-muted-foreground">Avg Yardage per Hole</p>
                        <p className="font-medium">{(selectedTee.yardage / 18).toFixed(0)} yards</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-muted-foreground">Avg Par per Hole</p>
                        <p className="font-medium">{selectedTee.course.par ? (selectedTee.course.par / 18).toFixed(1) : "?"}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-muted-foreground">Difficulty</p>
                        <Badge variant={selectedTee.slope && selectedTee.slope > 140 ? "destructive" : "secondary"}>
                          {selectedTee.slope && selectedTee.slope > 140 ? "Difficult" : "Moderate"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground border-t pt-4">
                  <p>Created: {new Date(selectedTee.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(selectedTee.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  )
}
