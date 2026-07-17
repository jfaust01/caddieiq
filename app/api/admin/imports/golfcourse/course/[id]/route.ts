import { NextRequest, NextResponse } from "next/server"
import { getCourseDetailsRepository } from "@/lib/repositories/course-details-repository"
import prismaClient from "@/lib/prisma"

/**
 * Fetch full course details by ID.
 * GET /api/admin/imports/golfcourse/course/[id]
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Missing course ID" },
        { status: 400 }
      )
    }

    const courseDetailsRepo = getCourseDetailsRepository(prismaClient)
    const result = await courseDetailsRepo.findById(id)

    if (result.outcome !== "ok" || !result.record) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(result.record)
  } catch (error) {
    console.error('[v0] Course details fetch failed:', error)
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    )
  }
}
