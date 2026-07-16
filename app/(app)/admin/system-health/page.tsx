import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { SystemHealthView } from "@/features/admin/system-health/system-health-view"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { getWeatherHealthReport } from "@/lib/system-health/weather-health"

export const metadata: Metadata = {
  title: "System Health",
  description: "Internal diagnostics: weather ingestion pipeline health.",
}

// Health is read live on every request; never cache this page.
export const dynamic = "force-dynamic"

export default async function SystemHealthPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  // ADMIN-only. Non-admins get a 404 rather than a 403 so the page's existence
  // is not disclosed — this route is intentionally absent from navigation.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== "ADMIN") notFound()

  const report = await getWeatherHealthReport()
  return <SystemHealthView report={report} />
}
