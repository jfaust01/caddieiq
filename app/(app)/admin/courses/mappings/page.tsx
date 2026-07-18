import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { TournamentCourseMappingBrowser } from "@/features/admin/courses/tournament-mapping-browser"
import { getSession, isCurrentUserAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Course Mappings",
  description: "Browse and manage tournament to GolfCourseAPI course mappings.",
}

export const dynamic = "force-dynamic"

export default async function MappingBrowserPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  if (!(await isCurrentUserAdmin())) notFound()

  return <TournamentCourseMappingBrowser />
}
