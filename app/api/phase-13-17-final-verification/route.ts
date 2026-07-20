import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTournamentCourseMappingRepository } from "@/lib/repositories/tournament-course-mapping-repository"
import { importCourseIntelligence } from "@/lib/imports/course-intelligence-import"
import { GolfCourseAPIClient } from "@/lib/providers/golfcourseapi/client"

export async function GET() {
  try {
    // Step 1: Get before counts
    const coursesBefore = await prisma.course.count()
    const courseDetailsBefore = await prisma.courseDetails.count()
    const courseHolesBefore = await prisma.courseHole.count()
    const courseTeesBefore = await prisma.courseTee.count()
    const teeHoleYardagesBefore = await prisma.teeHoleYardage.count()
    const courseAddressesBefore = await prisma.courseAddress.count()
    const courseCoordinatesBefore = await prisma.courseCoordinates.count()
    const courseMetadataBefore = await prisma.courseMetadata.count()
    const courseSpecificationsBefore = await prisma.courseSpecifications.count()

    const countsBefore = {
      courses: coursesBefore,
      courseDetails: courseDetailsBefore,
      courseHoles: courseHolesBefore,
      courseTees: courseTeesBefore,
      teeHoleYardages: teeHoleYardagesBefore,
      courseAddresses: courseAddressesBefore,
      courseCoordinates: courseCoordinatesBefore,
      courseMetadata: courseMetadataBefore,
      courseSpecifications: courseSpecificationsBefore,
      total: coursesBefore + courseDetailsBefore + courseHolesBefore + courseTeesBefore + 
             teeHoleYardagesBefore + courseAddressesBefore + courseCoordinatesBefore + 
             courseMetadataBefore + courseSpecificationsBefore,
    }

    // Step 2: Find VERIFIED mapping
    const mappingRepo = getTournamentCourseMappingRepository()
    const verifiedResult = await mappingRepo.findVerified()
    
    if (verifiedResult.outcome === "failed" || !verifiedResult.records || verifiedResult.records.length === 0) {
      return NextResponse.json({
        status: "NO_VERIFIED_MAPPINGS",
        message: "No verified mappings found to test",
        countsBefore,
      })
    }

    const verifiedMappings = verifiedResult.records
    console.log(`[v0] STEP 1: Found ${verifiedMappings.length} verified mappings`)

    // Step 3: Get API response for the first mapping
    const mapping = verifiedMappings[0]
    const apiClient = new GolfCourseAPIClient()
    let courseDetailResponse: any = null
    
    try {
      courseDetailResponse = await apiClient.fetchCourse(mapping.golfCourseApiCourseId!)
      console.log(`[v0] STEP 2: Fetched course ${mapping.golfCourseApiCourseId} from API`)
    } catch (apiError) {
      return NextResponse.json({
        status: "API_ERROR",
        error: apiError instanceof Error ? apiError.message : String(apiError),
        mapping: {
          id: mapping.id,
          golfCourseApiCourseId: mapping.golfCourseApiCourseId,
        },
        countsBefore,
      })
    }

    // Step 4: Run import
    const importResult = await importCourseIntelligence()
    console.log(`[v0] STEP 3: Import completed`)

    // Step 5: Get after counts
    const coursesAfter = await prisma.course.count()
    const courseDetailsAfter = await prisma.courseDetails.count()
    const courseHolesAfter = await prisma.courseHole.count()
    const courseTeesAfter = await prisma.courseTee.count()
    const teeHoleYardagesAfter = await prisma.teeHoleYardage.count()
    const courseAddressesAfter = await prisma.courseAddress.count()
    const courseCoordinatesAfter = await prisma.courseCoordinates.count()
    const courseMetadataAfter = await prisma.courseMetadata.count()
    const courseSpecificationsAfter = await prisma.courseSpecifications.count()

    const countsAfter = {
      courses: coursesAfter,
      courseDetails: courseDetailsAfter,
      courseHoles: courseHolesAfter,
      courseTees: courseTeesAfter,
      teeHoleYardages: teeHoleYardagesAfter,
      courseAddresses: courseAddressesAfter,
      courseCoordinates: courseCoordinatesAfter,
      courseMetadata: courseMetadataAfter,
      courseSpecifications: courseSpecificationsAfter,
      total: coursesAfter + courseDetailsAfter + courseHolesAfter + courseTeesAfter + 
             teeHoleYardagesAfter + courseAddressesAfter + courseCoordinatesAfter + 
             courseMetadataAfter + courseSpecificationsAfter,
    }

    const deltas = {
      courses: coursesAfter - coursesBefore,
      courseDetails: courseDetailsAfter - courseDetailsBefore,
      courseHoles: courseHolesAfter - courseHolesBefore,
      courseTees: courseTeesAfter - courseTeesBefore,
      teeHoleYardages: teeHoleYardagesAfter - teeHoleYardagesBefore,
      courseAddresses: courseAddressesAfter - courseAddressesBefore,
      courseCoordinates: courseCoordinatesAfter - courseCoordinatesBefore,
      courseMetadata: courseMetadataAfter - courseMetadataBefore,
      courseSpecifications: courseSpecificationsAfter - courseSpecificationsBefore,
      totalDelta: (countsAfter.total - countsBefore.total),
    }

    return NextResponse.json({
      status: "VERIFICATION_COMPLETE",
      step1_verifiedMapping: {
        id: mapping.id,
        golfCourseApiCourseId: mapping.golfCourseApiCourseId,
        matchConfidence: mapping.matchConfidence,
      },
      step2_apiResponse: {
        id: courseDetailResponse?.id,
        name: courseDetailResponse?.name,
        holesCount: courseDetailResponse?.holes?.length ?? 0,
        teesCount: courseDetailResponse?.tees?.length ?? 0,
        latitude: courseDetailResponse?.latitude,
        longitude: courseDetailResponse?.longitude,
        fullResponse: {
          hasId: !!courseDetailResponse?.id,
          hasName: !!courseDetailResponse?.name,
          hasHoles: !!courseDetailResponse?.holes,
          hasTees: !!courseDetailResponse?.tees,
          keys: courseDetailResponse ? Object.keys(courseDetailResponse).slice(0, 10) : [],
        },
      },
      step3_importStatistics: {
        coursesConsidered: importResult.coursesConsidered,
        coursesImported: importResult.coursesImported,
        coursesUpdated: importResult.coursesUpdated,
        coursesSkipped: importResult.coursesSkipped,
        holesImported: importResult.holesImported,
        teeBoxesImported: importResult.teeBoxesImported,
        failures: importResult.failures,
        warnings: importResult.warnings.slice(0, 3),
      },
      step4_databaseChanges: {
        before: countsBefore,
        after: countsAfter,
        deltas: deltas,
      },
      conclusion: {
        success: importResult.coursesImported > 0 && deltas.totalDelta > 0,
        message: importResult.coursesImported > 0 
          ? "PASS: Course import succeeded"
          : "FAIL: No courses imported",
      },
    })
  } catch (error) {
    return NextResponse.json({
      status: "ERROR",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
