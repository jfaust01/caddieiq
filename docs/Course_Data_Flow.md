# Course Data Flow

**Phase:** 15.3B Documentation

## Flow Overview

```
GolfCourseAPI
     ↓
CourseImporter (fetch course specs)
     ↓
Normalizer (map to Course model)
     ↓
Validator (validate course data)
     ↓
CourseRepository.bulkUpsert()
     ↓
Course Table + 7 Detail Tables
(Details, Holes, Tees, Coordinates, Address, Specifications, Metadata)
     ↓
Course Relations Builder
(Link holes to tees, validate integrity)
     ↓
CourseDetailsRepository +
CourseHoleRepository +
CourseTeeRepository
     ↓
CourseIntelligenceService
(Fetch details, holes, tees → generate intelligence)
     ↓
CourseIntelligenceEngine
(Pure function: specs → traits)
     ↓
CourseIntelligence Table
(Persisted traits: birdie, accuracy, distance, firmness)
     ↓
API Routes
     ↓
React Components (Course Detail, Tournament Intel)
```

## Database Schema

### Core Tables
```typescript
model Course {
  id          String   @id
  name        String
  slug        String   @unique
  
  // Relations to detail tables
  details     CourseDetails?
  holes       CourseHole[]
  tees        CourseTee[]
  coordinates CourseCoordinates?
  address     CourseAddress?
  intelligence CourseIntelligence?
}

model CourseDetails {
  id              String @id
  courseId        String @unique
  course          Course @relation(fields: [courseId], references: [id])
  
  par             Int
  totalYardage    Int
  courseRating    Float
  slopeRating     Int
  grassTypeFairway String?
  grassTypeGreen  String?
  greenSize       String?
  greenSpeed      String?
  elevation       Int?
  courseStyle     String?
  architect       String?
  yearBuilt       Int?
}

model CourseHole {
  id           String @id
  courseId     String
  course       Course @relation(fields: [courseId], references: [id])
  
  holeNumber   Int
  par          Int
  yardage      Int
  handicap     Int
  
  @@unique([courseId, holeNumber])
}

model CourseTee {
  id       String @id
  courseId String
  course   Course @relation(fields: [courseId], references: [id])
  
  teeName  String  // "Blue", "White", "Red", etc.
  yardage  Int
  rating   Float
  slope    Int
}

model CourseIntelligence {
  id              String @id
  courseId        String @unique
  course          Course @relation(fields: [courseId], references: [id])
  
  birdieRank      Int?   // 1-100 (higher = easier)
  accuracyRank    Int?
  distanceRank    Int?
  firmnessRank    Int?
  hash            String // Deterministic hash for change detection
  
  generatedAt     DateTime
  buildVersion    Int
}
```

## Import Pipeline

### Step 1: Fetch Course List
**Source:** GolfCourseAPI  
**Provider:** `GolfCourseApiProvider.getCoursesByTournament(tournamentId)`

**Raw Response:**
```json
{
  "courseId": "doral-1234",
  "name": "Doral Golf Club",
  "address": "4400 NW 87th Ave, Doral, FL 33178",
  "par": 72,
  "yardage": 7518,
  "courseRating": 75.2,
  "slopeRating": 134,
  "holes": [
    { "holeNumber": 1, "par": 4, "yardage": 412, "handicap": 11 },
    ...
  ],
  "tees": [
    { "name": "Blue", "yardage": 7518, "rating": 75.2, "slope": 134 },
    ...
  ]
}
```

### Step 2: Map to Domain Model
**Normalizer:** `mapGolfCourseApiCourse(raw) → Course`

Splits course data into normalized entities:

1. **Course** - Primary entity
2. **CourseDetails** - Specs (par, yardage, rating, grass, etc.)
3. **CourseCoordinates** - Lat/lon with geocoding source
4. **CourseAddress** - Street address components
5. **CourseHole[]** - 18 holes (normalized from raw)
6. **CourseTee[]** - Tee boxes (Blue, White, Red, etc.)

### Step 3: Validate
**Checks:**
- ✓ courseId is non-empty
- ✓ name is non-empty
- ✓ par is 18 or 9
- ✓ Exactly 18 or 9 holes
- ✓ All tees have yardage
- ✓ All holes have par, handicap
- ✓ Holes are numbered 1-18
- ✓ Coordinates are valid lat/lon

**Failure Mode:** Skip course, log validation errors

### Step 4: Persist
**Repository:** `CourseRepository.bulkUpsert(courses)`

**Transaction:**
```sql
BEGIN;
  INSERT INTO Course (id, name, slug) ...
  INSERT INTO CourseDetails (courseId, par, yardage, ...) ...
  INSERT INTO CourseHole (courseId, holeNumber, par, yardage, ...) ...
  INSERT INTO CourseTee (courseId, teeName, yardage, ...) ...
COMMIT;
```

## Course Intelligence Generation

### Trigger
Course intelligence is generated on-demand (lazy):

1. User navigates to tournament detail page
2. TournamentCommandCenter requests course intelligence
3. CourseIntelligenceService.getCourseIntelligence(courseId)
4. Service checks if intelligence exists (cached)
5. If not, calls engine to generate

### Engine: Pure Calculation
**Input:** Course details, holes, tees

**Algorithm:**
```typescript
function generateCourseIntelligence(input: CourseAnalysisInput): CourseIntelligence {
  // Calculate trait scores (0-100)
  const birdieScore = calculateBirdieRank(input.par, input.totalYardage, input.greenSize)
  const accuracyScore = calculateAccuracyRank(input.grassType, input.courseStyle)
  const distanceScore = calculateDistanceRank(input.totalYardage, input.par)
  const firmnessScore = calculateFirmnessRank(input.grassType, input.elevation)
  
  return {
    id: uuid(),
    courseId: input.courseId,
    birdieRank: birdieScore,
    accuracyRank: accuracyScore,
    distanceRank: distanceScore,
    firmnessRank: firmnessScore,
    hash: hash(input),  // Deterministic
    generatedAt: now(),
    buildVersion: 1
  }
}
```

### Persistence
**Repository:** `CourseIntelligenceRepository.create(intelligence)`

Upserts into CourseIntelligence table (one per course)

## Data Retrieval

### CourseRepository
```typescript
findById(id: string): Promise<Result<Course>>
findBySlug(slug: string): Promise<Result<Course>>
findByTournament(tournamentId: string): Promise<Result<Course[]>>
```

### CourseDetailsRepository
```typescript
findById(id: string): Promise<Result<CourseDetails>>
findByCourseId(courseId: string): Promise<Result<CourseDetails>>
```

### CourseHoleRepository
```typescript
findByCourseId(courseId: string): Promise<Result<CourseHole[]>>
```

### CourseTeeRepository
```typescript
findByCourseId(courseId: string): Promise<Result<CourseTee[]>>
```

### CourseIntelligenceRepository
```typescript
findByCourseId(courseId: string): Promise<Result<CourseIntelligence>>
```

## API Endpoints

### GET /api/courses/:id
Returns course details, holes, tees, and intelligence

### GET /api/courses/:id/intelligence
Returns course intelligence traits (birdie, accuracy, distance, firmness)

### GET /api/courses/search
Query courses by name or location

## Failure Points

| Point | Failure | Handling |
|-------|---------|----------|
| Provider API down | HTTP 5xx | Logged, retry scheduled |
| Course not found | 404 from API | Logged, skipped |
| Validation fails | Missing holes | Logged, record rejected |
| Intelligence gen fails | Engine error | Logged, honest unavailable |
| DB constraint | Duplicate courseId | Update existing record |
| Coordinate lookup | Invalid address | Skipped, geo unavailable |

## Refresh Strategy

- **Course specs:** Quarterly (off-season)
- **Course intelligence:** Monthly (or manual recalc)
- **TTL:** None (historical)

