import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { CourseTeesBrowser } from "@/features/admin/courses/course-tees-browser"
import { getSession, isCurrentUserAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Course Tees",
  description: "Browse and inspect tee boxes with filtering and sorting.",
}

export const dynamic = "force-dynamic"

export default async function CourseTeesPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  if (!(await isCurrentUserAdmin())) notFound()

  return <CourseTeesBrowser />
}
