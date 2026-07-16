import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { DatabaseHealthView } from "@/features/admin/database-health/database-health-view"
import { getDatabaseHealthReport } from "@/lib/system-health/database-health"
import { getSession, isCurrentUserAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Database Health",
  description: "Internal operations: database health, table populations, and import pipelines.",
}

// Health is read live on every request; never cache this page.
export const dynamic = "force-dynamic"

export default async function DatabaseHealthPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  // ADMIN-only. Non-admins get a 404 rather than a 403 so the page's existence
  // is not disclosed — this route is intentionally absent from navigation. The
  // role is re-read from the database inside the helper, never trusted from the
  // client.
  if (!(await isCurrentUserAdmin())) notFound()

  const report = await getDatabaseHealthReport()
  return <DatabaseHealthView report={report} />
}
