import { PageHeader } from '@/features/ui/shared'
import { PageShell } from '@/components/shared/page-shell'
import { CourseDirectory } from '@/features/courses/components/course-directory'
import { MapPinned, BarChart3, Users, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function CoursesView() {
  return (
    <PageShell>
      <PageHeader
        title="Courses"
        description="Browse the course database. Search by name, city, or location to find playing conditions and characteristics."
        icon={<MapPinned className="h-6 w-6" />}
      />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPinned className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs text-foreground/60">Tracked Courses</p>
                <p className="text-2xl font-bold">312</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-foreground/60">Avg Difficulty</p>
                <p className="text-2xl font-bold">71.2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-foreground/60">This Year</p>
                <p className="text-2xl font-bold">47</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-foreground/60">Scoring</p>
                <p className="text-2xl font-bold">+1.2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CourseDirectory />
    </PageShell>
  )
}
