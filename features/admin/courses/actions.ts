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
