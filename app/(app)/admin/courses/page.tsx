import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { CourseDetailsBrowser } from "@/features/admin/courses/course-details-browser"
import { getSession, isCurrentUserAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Course Details",
  description: "Browse and inspect GolfCourseAPI course data with filtering and sorting.",
}

export const dynamic = "force-dynamic"

export default async function CourseDetailsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  if (!(await isCurrentUserAdmin())) notFound()

  return <CourseDetailsBrowser />
}
