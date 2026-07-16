# Courses Page Fix — Complete Data Flow Implementation

## Problem
The Courses page displayed no data despite ~205 courses existing in the database. The page used a stub `ResourceView` component that only showed an empty state, with no actual data loading pipeline.

## Root Cause
The Courses feature lacked the complete data-fetching architecture that other features (tournaments, players) use:
- No `list` method in `CourseRepository` to query multiple courses
- No `queryCourses` method in `courseService`
- No server action (`course-actions`) to fetch data from the client
- No `useCourses` hook for client-side state management
- No `CourseDirectory` component to render the data
- Missing supporting components (search, card, pagination, skeleton)

## Solution Implemented

### 1. Database Layer — CourseRepository
**File**: `lib/repositories/course-repository.ts`

Added `list()` method to query courses with:
- Optional full-text search (name, city, stateProvince, country)
- Pagination (skip/take)
- Sorting (default: name ASC)
- Soft-delete exclusion (deletedAt IS NULL)
- Atomic count + results via `Promise.all()`

```typescript
async list(options: {
  search?: string
  skip?: number
  take?: number
  orderBy?: { field: string; direction: 'asc' | 'desc' }
}): Promise<{ courses: CourseRecord[]; total: number }>
```

### 2. Service Layer — courseService
**File**: `features/courses/services/course-service.ts`

Added `queryCourses()` method that:
- Calls `repository.list()` with live search/pagination
- Maps database records to `CourseSummary` (minimal shape for listings)
- Exposed via `courseService.queryCourses()`

### 3. Types — CourseSummary
**File**: `features/courses/types/index.ts`

Created new `CourseSummary` type for list views:
```typescript
export interface CourseSummary {
  id: string
  name: string
  slug: string
  city: string | null
  stateProvince: string | null
  country: string | null
}
```

### 4. Server Action — course-actions
**File**: `features/courses/services/course-actions.ts`

Created `fetchCourses()` server action that:
- Accepts `CourseQuery` (search, page, pageSize)
- Wraps `courseService.queryCourses()` with error handling
- Returns discriminated `ActionResult<PaginatedResult<CourseSummary>>`
- Converts database errors to coarse `DATABASE_UNAVAILABLE` for security

### 5. Client Hook — useCourses
**File**: `features/courses/hooks/use-courses.ts`

Created `useCourses()` hook that:
- Manages filters (search), pagination state via React hooks
- Fetches via `fetchCourses()` server action with TanStack Query
- Maintains previous page data during transitions (`keepPreviousData`)
- Exposes: filters, setSearch, resetFilters, page, setPage, result, isLoading, isError

### 6. Client Components
**Files**: 
- `features/courses/components/course-directory.tsx` — Main component with grid/loading/empty states
- `features/courses/components/course-search.tsx` — Search input wrapper
- `features/courses/components/course-card.tsx` — Clickable card linking to detail page
- `features/courses/components/course-pagination.tsx` — Page navigation
- `features/courses/components/course-skeleton.tsx` — Loading skeleton grid

### 7. View Layer
**File**: `features/courses/courses-view.tsx`

Updated from stub `ResourceView` to:
```typescript
export function CoursesView() {
  return (
    <PageShell>
      <PageHeader ... />
      <CourseDirectory />
    </PageShell>
  )
}
```

## Data Flow

```
User visits /courses
    ↓
CoursesView renders CourseDirectory
    ↓
useCourses() hook initializes with default filters + page 1
    ↓
TanStack Query calls fetchCourses(query)
    ↓
fetchCourses (server action)
    ↓
courseService.queryCourses() → repository.list()
    ↓
Prisma course.findMany() + count()
    ↓
Results mapped to CourseSummary[]
    ↓
Return PaginatedResult to client
    ↓
CourseDirectory renders:
  - ResultSummary (page X of Y)
  - CourseSkeleton while loading
  - CourseCard grid with results OR
  - EmptyState if no matches/error
  - CoursePagination for navigation
```

## Testing Checklist

✅ Typecheck passes (no TS errors)
✅ Build succeeds
✅ Page renders without errors
✅ Courses load from database (confirm via network tab)
✅ Search filters work (hits repository.list with OR clause)
✅ Pagination navigates between pages
✅ Empty state displays when no results match filters
✅ Error state displays if database is unavailable
✅ Skeleton appears during load
✅ Loading state clears when data arrives

## Performance Notes

- Search uses **insensitive full-text search** on 4 fields (name, city, stateProvince, country)
- **Pagination default**: 9 courses per page
- **Database queries**: Atomic count + results via `Promise.all()`
- **Not cached**: Results are fresh on every search/filter (intentional for live data)
- **Previous page preserved** during transitions (TanStack Query `keepPreviousData`)

## Documentation Updated

All new code follows CaddieIQ architecture conventions:
- Pure service layer (no direct Prisma in components)
- Server actions as RPC boundary
- Client hooks for state management
- Skeleton + empty state patterns
- Accessible component structure (sr-only, aria-live)
