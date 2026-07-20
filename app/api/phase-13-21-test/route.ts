import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { importCourseIntelligence } from "@/lib/imports/course-intelligence-import"

export async function GET() {
  try {
    console.log("[v0] ===== PHASE 13.21: OUTCOME HANDLING FIX TEST =====")
    
    // Get before counts
    const coursesBefore = await prisma.course.count()
    const courseDetailsBefore = await prisma.courseDetails.count()
    const courseHolesBefore = await prisma.courseHole.count()
    const courseTeesBefore = await prisma.courseTee.count()
    const teeHoleYardagesBefore = await prisma.teeHoleYardage.count()
    const courseAddressesBefore = await prisma.courseAddress.count()
    const courseCoordinatesBefore = await prisma.courseCoordinates.count()
    const courseMetadataBefore = await prisma.courseMetadata.count()
    const courseSpecificationsBefore = await prisma.courseSpecifications.count()
    
    const beforeCounts = {
      courses: coursesBefore,
      courseDetails: courseDetailsBefore,
      courseHoles: courseHolesBefore,
      courseTees: courseTeesBefore,
      teeHoleYardages: teeHoleYardagesBefore,
      courseAddresses: courseAddressesBefore,
      courseCoordinates: courseCoordinatesBefore,
      courseMetadata: courseMetadataBefore,
      courseSpecifications: courseSpecificationsBefore,
    }
    
    console.log("[v0] Before:", beforeCounts)
    
    // Run import
    const result = await importCourseIntelligence()
    
    // Get after counts
    const coursesAfter = await prisma.course.count()
    const courseDetailsAfter = await prisma.courseDetails.count()
    const courseHolesAfter = await prisma.courseHole.count()
    const courseTeesAfter = await prisma.courseTee.count()
    const teeHoleYardagesAfter = await prisma.teeHoleYardage.count()
    const courseAddressesAfter = await prisma.courseAddress.count()
    const courseCoordinatesAfter = await prisma.courseCoordinates.count()
    const courseMetadataAfter = await prisma.courseMetadata.count()
    const courseSpecificationsAfter = await prisma.courseSpecifications.count()
    
    const afterCounts = {
      courses: coursesAfter,
      courseDetails: courseDetailsAfter,
      courseHoles: courseHolesAfter,
      courseTees: courseTeesAfter,
      teeHoleYardages: teeHoleYardagesAfter,
      courseAddresses: courseAddressesAfter,
      courseCoordinates: courseCoordinatesAfter,
      courseMetadata: courseMetadataAfter,
      courseSpecifications: courseSpecificationsAfter,
    }
    
    console.log("[v0] After:", afterCounts)
    
    // Calculate deltas
    const deltas: Record<string, number> = {}
    for (const [key, before] of Object.entries(beforeCounts)) {
      deltas[key] = afterCounts[key as keyof typeof afterCounts] - before
    }
    
    return NextResponse.json({
      status: "SUCCESS",
      importStatistics: result,
      beforeCounts,
      afterCounts,
      deltas,
    })
  } catch (error) {
    return NextResponse.json({
      status: "ERROR",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
