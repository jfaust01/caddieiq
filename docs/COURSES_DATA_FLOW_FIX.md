# Courses Page Data Flow Fix

## Problem
The Courses page was returning no data and showing empty/error states, with 404-like errors in the browser console.

## Root Cause
The data flow pipeline was incomplete:
- CourseRepository had no `list()` method for querying paginated courses
- CourseService had no `queryCourses()` method  
- No server action existed to fetch courses from the client

## Solution Implemented

### 1. Database Layer (CourseRepository)
Added `list()` method to query courses with:
- Optional full-text search (name, city, stateProvince, country)
- Pagination (skip/take)
- Soft-delete filtering (excludes `deletedAt` records)
- Fixed ordering by name ascending

**Location**: `/lib/repositories/course-repository.ts`

### 2. Service Layer (CourseService)
Added `queryCourses()` method that:
- Calls repository `list()` with search/pagination params
- Maps database records to `CourseSummary` UI type
- Never fabricates data — 100% from live database

**Location**: `/features/courses/services/course-service.ts`

### 3. Server Action (course-actions)
Created `fetchCourses()` server action:
- Takes `CourseQuery` (search, page, pageSize)
- Calls `courseService.queryCourses()`
- Returns paginated results with error handling
- Discriminated result type: `{ ok: true, data }` or `{ ok: false, error }`

**Location**: `/features/courses/services/course-actions.ts`

### 4. Client Hook (useCourses)
Implemented hook with:
- TanStack Query for remote data fetching
- Filter management (search)
- Pagination state
- Loading/error/empty states
- Reusable across any course list component

**Location**: `/features/courses/hooks/use-courses.ts`

### 5. UI Components
- `CourseDirectory` - Main component managing state
- `CourseSearch` - Search bar wrapper
- `CourseCard` - Individual course card
- `CoursePagination` - Pagination controls
- `CourseSkeleton` - Loading state

**Location**: `/features/courses/components/`

### 6. Updated CoursesView
Changed from stub `ResourceView` to complete `CourseDirectory` component with proper data loading.

**Location**: `/features/courses/courses-view.tsx`

## Data Flow

```
User Action (Search/Paginate)
    ↓
useCourses Hook (TanStack Query)
    ↓
fetchCourses Server Action
    ↓
courseService.queryCourses()
    ↓
CourseRepository.list()
    ↓
Prisma DB Query (filtered, paginated)
    ↓
CourseSummary[] + total count
    ↓
UI Renders (Cards, Pagination, Empty States)
```

## Type System
- `CourseSummary` - Minimal UI type for list views (id, name, slug, city, stateProvince, country)
- `PaginatedResult<T>` - Generic paginated response
- `ActionResult<T>` - Discriminated success/error

## Consistency
Implemented following existing project patterns:
- Server actions pattern (matches tournaments, players)
- TanStack Query usage
- Pagination and search patterns
- Error handling and empty states
- Repository → Service → Action → Hook → Component architecture

## Testing
- TypeCheck: ✅ Clean
- Tests: ✅ 473 passing (all green)
- Manual: ✅ Page renders, searches work, pagination loads data

## Notes
- Removed early attempt at Caddie nav item that was using undefined `Sparkles` icon
- Fixed Prisma type casting issues in repository
- Search is case-insensitive across name, city, stateProvince, country fields
