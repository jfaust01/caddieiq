"use server"

import { prisma } from "@/lib/prisma"

export interface CourseDetailWithRelations {
  id: string
  externalCourseId: string
  courseName: string
  clubName: string | null
  city: string | null
  state: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  par: number | null
  totalYardage: number | null
  courseRating: number | null
  slopeRating: number | null
  website: string | null
  phone: string | null
  architect: string | null
  yearBuilt: number | null
  courseStyle: string | null
  grassTypeFairway: string | null
  grassTypeGreen: string | null
  greenSize: string | null
  greenSpeed: string | null
  elevation: number | null
  drivingRange: boolean | null
  puttingGreen: boolean | null
  shortGameArea: boolean | null
  createdAt: Date
  updatedAt: Date
  holes: Array<{ id: string; holeNumber: number; par: number | null; yardage: number | null }>
  tees: Array<{ id: string; teeName: string; teeColor: string | null; yardage: number | null }>
}

export async function fetchCourseDetails(params: {
  search?: string
  country?: string
  state?: string
  parMin?: number
  parMax?: number
  sortBy?: "name" | "par" | "yardage"
  sortDir?: "asc" | "desc"
  limit?: number
}): Promise<CourseDetailWithRelations[]> {
  const {
    search,
    country,
    state,
    parMin,
    parMax,
    sortBy = "name",
    sortDir = "asc",
    limit = 100,
  } = params

  const where: any = {}

  // Text search
  if (search) {
    where.OR = [
      { courseName: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { state: { contains: search, mode: "insensitive" } },
      { clubName: { contains: search, mode: "insensitive" } },
    ]
  }

  // Filters
  if (country) where.country = country
  if (state) where.state = state

  // Range filters
  if (parMin !== undefined || parMax !== undefined) {
    where.par = {}
    if (parMin !== undefined) where.par.gte = parMin
    if (parMax !== undefined) where.par.lte = parMax
  }

  // Build order by
  const orderByField =
    sortBy === "par"
      ? "par"
      : sortBy === "yardage"
        ? "totalYardage"
        : "courseName"

  const courses = await prisma.courseDetails.findMany({
    where,
    include: {
      holes: {
        select: {
          id: true,
          holeNumber: true,
          par: true,
          yardage: true,
        },
        orderBy: { holeNumber: "asc" },
      },
      tees: {
        select: {
          id: true,
          teeName: true,
          teeColor: true,
          yardage: true,
        },
        orderBy: { teeName: "asc" },
      },
    },
    orderBy: {
      [orderByField]: sortDir,
    },
    take: limit,
  })

  return courses as CourseDetailWithRelations[]
}

export interface CourseHoleWithCourse {
  id: string
  courseId: string
  holeNumber: number
  par: number | null
  yardage: number | null
  handicap: number | null
  createdAt: Date
  updatedAt: Date
  course: {
    id: string
    courseName: string
    city: string | null
    state: string | null
    par: number | null
    totalYardage: number | null
  }
}

export async function fetchCourseHoles(params: {
  search?: string
  holeNumber?: number
  par?: number
  sortBy?: "course" | "hole" | "par" | "yardage"
  sortDir?: "asc" | "desc"
  limit?: number
}): Promise<CourseHoleWithCourse[]> {
  const {
    search,
    holeNumber,
    par,
    sortBy = "course",
    sortDir = "asc",
    limit = 100,
  } = params

  const where: any = {}

  // Text search on course name
  if (search) {
    where.course = {
      courseName: { contains: search, mode: "insensitive" },
    }
  }

  // Hole number filter
  if (holeNumber !== undefined) {
    where.holeNumber = holeNumber
  }

  // Par filter
  if (par !== undefined) {
    where.par = par
  }

  // Build order by
  const orderByField =
    sortBy === "hole"
      ? "holeNumber"
      : sortBy === "par"
        ? "par"
        : sortBy === "yardage"
          ? "yardage"
          : undefined

  const orderBy: any = orderByField
    ? { [orderByField]: sortDir }
    : { course: { courseName: sortDir }, holeNumber: "asc" }

  const holes = await prisma.courseHole.findMany({
    where,
    include: {
      course: {
        select: {
          id: true,
          courseName: true,
          city: true,
          state: true,
          par: true,
          totalYardage: true,
        },
      },
    },
    orderBy,
    take: limit,
  })

  return holes as CourseHoleWithCourse[]
}

export interface CourseTeeWithCourse {
  id: string
  courseId: string
  teeName: string
  teeColor: string | null
  gender: string | null
  yardage: number | null
  rating: number | null
  slope: number | null
  createdAt: Date
  updatedAt: Date
  course: {
    id: string
    courseName: string
    city: string | null
    state: string | null
    par: number | null
  }
}

export async function fetchCourseTees(params: {
  search?: string
  teeName?: string
  gender?: string
  sortBy?: "course" | "name" | "yardage" | "rating"
  sortDir?: "asc" | "desc"
  limit?: number
}): Promise<CourseTeeWithCourse[]> {
  const {
    search,
    teeName,
    gender,
    sortBy = "course",
    sortDir = "asc",
    limit = 100,
  } = params

  const where: any = {}

  // Text search on course or tee name
  if (search) {
    where.OR = [
      { course: { courseName: { contains: search, mode: "insensitive" } } },
      { teeName: { contains: search, mode: "insensitive" } },
    ]
  }

  // Tee name filter
  if (teeName !== undefined) {
    where.teeName = teeName
  }

  // Gender filter
  if (gender !== undefined) {
    where.gender = gender
  }

  // Build order by
  const orderByField =
    sortBy === "name"
      ? "teeName"
      : sortBy === "yardage"
        ? "yardage"
        : sortBy === "rating"
          ? "rating"
          : undefined

  const orderBy: any = orderByField
    ? { [orderByField]: sortDir }
    : { course: { courseName: sortDir }, teeName: "asc" }

  const tees = await prisma.courseTee.findMany({
    where,
    include: {
      course: {
        select: {
          id: true,
          courseName: true,
          city: true,
          state: true,
          par: true,
        },
      },
    },
    orderBy,
    take: limit,
  })

  return tees as CourseTeeWithCourse[]
}

export interface TournamentMappingWithDetails {
  id: string
  tournamentId: string
  sportsDataIoCourseId: string | null
  golfCourseApiCourseId: number
  tournamentCourseName: string | null
  golfCourseCourseName: string | null
  matchConfidence: number | null
  matchedBy: string | null
  verified: boolean
  lastSyncedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export async function fetchTournamentMappings(params: {
  search?: string
  verified?: boolean
  sortBy?: "tournament" | "confidence" | "updated"
  sortDir?: "asc" | "desc"
  limit?: number
}): Promise<TournamentMappingWithDetails[]> {
  const {
    search,
    verified,
    sortBy = "tournament",
    sortDir = "asc",
    limit = 100,
  } = params

  const where: any = {}

  // Text search
  if (search) {
    where.OR = [
      { tournamentCourseName: { contains: search, mode: "insensitive" } },
      { golfCourseCourseName: { contains: search, mode: "insensitive" } },
    ]
  }

  // Verification filter
  if (verified !== undefined) {
    where.verified = verified
  }

  // Build order by
  const orderByField =
    sortBy === "confidence"
      ? "matchConfidence"
      : sortBy === "updated"
        ? "updatedAt"
        : "tournamentCourseName"

  const mappings = await prisma.tournamentCourseMapping.findMany({
    where,
    orderBy: {
      [orderByField]: sortDir,
    },
    take: limit,
  })

  return mappings as TournamentMappingWithDetails[]
}

export async function toggleMappingVerification(
  mappingId: string,
  verified: boolean,
): Promise<void> {
  await prisma.tournamentCourseMapping.update({
    where: { id: mappingId },
    data: { verified },
  })
}

export interface QualityReport {
  totalCourses: number
  completeness: number
  issues: Array<{
    type: string
    severity: 'critical' | 'warning' | 'info'
    count: number
    percentage: number
    description: string
    examples?: string[]
  }>
  recommendations: string[]
}

export async function getQualityReport(): Promise<QualityReport> {
  const totalCourses = await prisma.courseDetails.count()

  if (totalCourses === 0) {
    return {
      totalCourses: 0,
      completeness: 0,
      issues: [
        {
          type: 'No courses imported',
          severity: 'critical',
          count: 0,
          percentage: 0,
          description: 'No courses found in the database. Run course intelligence import first.',
        },
      ],
      recommendations: ['Import courses using the GolfCourseAPI integration'],
    }
  }

  const issues: QualityReport['issues'] = []
  const recommendations: string[] = []

  // Check for missing course details
  const coursesWithoutAddress = await prisma.courseDetails.count({
    where: {
      OR: [{ city: null }, { state: null }],
    },
  })
  if (coursesWithoutAddress > 0) {
    issues.push({
      type: 'Incomplete address data',
      severity: 'warning',
      count: coursesWithoutAddress,
      percentage: Math.round((coursesWithoutAddress / totalCourses) * 100),
      description: 'Some courses are missing city or state information',
    })
  }

  const coursesWithoutCoordinates = await prisma.courseDetails.count({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
    },
  })
  if (coursesWithoutCoordinates > 0) {
    issues.push({
      type: 'Missing GPS coordinates',
      severity: 'warning',
      count: coursesWithoutCoordinates,
      percentage: Math.round((coursesWithoutCoordinates / totalCourses) * 100),
      description: 'Some courses are missing latitude or longitude for mapping',
    })
  }

  // Check hole count
  const coursesByHoleCount = await prisma.$queryRaw<
    Array<{ courseId: string; holeCount: number }>
  >`
    SELECT "courseId", COUNT(*) as "holeCount"
    FROM "course_holes"
    GROUP BY "courseId"
  `

  const coursesWithoutFullHoles = coursesByHoleCount.filter((c) => c.holeCount !== 18).length
  if (coursesWithoutFullHoles > 0) {
    issues.push({
      type: 'Incomplete hole data',
      severity: 'critical',
      count: coursesWithoutFullHoles,
      percentage: Math.round((coursesWithoutFullHoles / totalCourses) * 100),
      description: 'Some courses do not have all 18 holes',
    })
  }

  // Check tee box coverage
  const coursesByTeeCount = await prisma.$queryRaw<
    Array<{ courseId: string; teeCount: number }>
  >`
    SELECT "courseId", COUNT(*) as "teeCount"
    FROM "course_tees"
    GROUP BY "courseId"
  `

  const coursesWithoutTees = totalCourses - coursesByTeeCount.length
  if (coursesWithoutTees > 0) {
    issues.push({
      type: 'Missing tee boxes',
      severity: 'critical',
      count: coursesWithoutTees,
      percentage: Math.round((coursesWithoutTees / totalCourses) * 100),
      description: 'Some courses have no tee box definitions',
    })
  }

  const coursesWithInsufficientTees = coursesByTeeCount.filter((c) => c.teeCount < 1).length
  if (coursesWithInsufficientTees > 0) {
    issues.push({
      type: 'Insufficient tee boxes',
      severity: 'warning',
      count: coursesWithInsufficientTees,
      percentage: Math.round((coursesWithInsufficientTees / totalCourses) * 100),
      description: 'Some courses have fewer than 3 tee boxes (expected for most courses)',
    })
  }

  // Check missing ratings
  const teesWithoutRating = await prisma.courseTee.count({
    where: { rating: null },
  })
  if (teesWithoutRating > 0) {
    const totalTees = await prisma.courseTee.count()
    issues.push({
      type: 'Missing course ratings',
      severity: 'warning',
      count: teesWithoutRating,
      percentage: totalTees > 0 ? Math.round((teesWithoutRating / totalTees) * 100) : 0,
      description: 'Some tee boxes are missing USGA course ratings needed for handicap calculations',
    })
  }

  // Check missing slopes
  const teesWithoutSlope = await prisma.courseTee.count({
    where: { slope: null },
  })
  if (teesWithoutSlope > 0) {
    const totalTees = await prisma.courseTee.count()
    issues.push({
      type: 'Missing slope ratings',
      severity: 'warning',
      count: teesWithoutSlope,
      percentage: totalTees > 0 ? Math.round((teesWithoutSlope / totalTees) * 100) : 0,
      description: 'Some tee boxes are missing USGA slope ratings needed for handicap calculations',
    })
  }

  // Calculate completeness
  let completeCount = totalCourses
  if (coursesWithoutAddress > 0) completeCount -= 1
  if (coursesWithoutCoordinates > 0) completeCount -= 1
  if (coursesWithoutFullHoles > 0) completeCount -= 1
  if (coursesWithoutTees > 0) completeCount -= 1

  const completeness = Math.max(0, Math.floor((completeCount / totalCourses) * 100))

  // Add recommendations
  if (coursesWithoutFullHoles > 0) {
    recommendations.push('Re-run course intelligence import for courses with incomplete hole data')
  }
  if (coursesWithoutTees > 0) {
    recommendations.push('Verify course data in GolfCourseAPI or re-import')
  }
  if (teesWithoutRating > 0 || teesWithoutSlope > 0) {
    recommendations.push('Ensure USGA ratings and slopes are populated in GolfCourseAPI')
  }
  if (completeness < 80) {
    recommendations.push('Before using courses for golfer ratings, aim for >95% data completeness')
  }

  return {
    totalCourses,
    completeness,
    issues,
    recommendations,
  }
}
