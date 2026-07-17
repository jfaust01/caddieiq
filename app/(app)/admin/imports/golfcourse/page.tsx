import type { Metadata } from 'next'
import { GolfCourseAdminImportClient } from '@/features/admin/components/golfcourse-admin-import-client'

export const metadata: Metadata = {
  title: 'GolfCourse Admin Import',
  description: 'Re-import course data and debug GolfCourseAPI integration issues.',
}

export default function GolfCourseImportPage() {
  return <GolfCourseAdminImportClient />
}
