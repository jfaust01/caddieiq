import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { CourseHolesBrowser } from "@/features/admin/courses/course-holes-browser"
import { getSession, isCurrentUserAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Course Holes",
  description: "Browse and inspect individual golf holes with filtering and sorting.",
}

export const dynamic = "force-dynamic"

export default async function CourseHolesPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  if (!(await isCurrentUserAdmin())) notFound()

  return <CourseHolesBrowser />
}
