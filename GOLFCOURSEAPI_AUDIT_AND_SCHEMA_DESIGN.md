# GolfCourseAPI Response Audit & Normalized Schema Design

## Part 1: Complete GolfCourseAPI Response Inventory

### Root Level: GolfCourseDetail

```typescript
{
  id: number                          // API identifier (external ID)
  name: string                        // Course name
  clubName?: string                   // Club/facility name
  address?: { ... }                   // Nested address object
  coordinates?: { ... }               // Nested coordinates object
  contact?: { ... }                   // Nested contact object
  specifications?: { ... }            // Nested course specifications
  metadata?: { ... }                  // Nested metadata
  playingConditions?: { ... }         // Nested conditions
  facilities?: { ... }                // Nested facilities
  holes?: Array<{ ... }>              // Nested holes collection
  tees?: Array<{ ... }>               // Nested tees collection
}
```

### Nested Objects & Collections

#### address
```typescript
{
  city?: string
  state?: string
  country?: string
}
```

#### coordinates
```typescript
{
  latitude: number
  longitude: number
}
```

#### contact
```typescript
{
  website?: string
  phone?: string
}
```

#### specifications
```typescript
{
  par?: number                // Course total par
  totalYardage?: number       // Course total yardage
  courseRating?: number       // Course rating (difficulty)
  slopeRating?: number        // Slope rating
}
```

#### metadata
```typescript
{
  architect?: string
  yearBuilt?: number
  courseStyle?: string        // Should match CourseStyle enum
}
```

#### playingConditions
```typescript
{
  grassTypeFairway?: string   // Should match GrassType enum
  grassTypeGreen?: string     // Should match GrassType enum
  greenSize?: string          // Descriptive size
  greenSpeed?: string         // e.g., "Stimp 12"
  elevation?: number          // In feet above sea level
}
```

#### facilities
```typescript
{
  drivingRange?: boolean
  puttingGreen?: boolean
  shortGameArea?: boolean
}
```

#### holes (Array<HoleData>)
```typescript
{
  number: number              // Hole number (1-18)
  par?: number                // Individual hole par
  yardage?: number            // Individual hole yardage
  handicap?: number           // Hole handicap (stroke index)
}
```

#### tees (Array<TeeBoxData>)
```typescript
{
  name: string                // Tee name (e.g., "Championship", "Member")
  color?: string              // Tee color
  gender?: string             // e.g., "M", "F", "Mixed"
  yardage?: number            // Total tees yardage
  rating?: number             // Rating from this tee
  slope?: number              // Slope from this tee
}
```

---

## Part 2: Normalization Assessment

### Entity Analysis

| Entity | Type | Should Normalize? | Reason |
|--------|------|---|---|
| **Course** | Aggregate root | YES | Core entity, multiple foreign keys reference it |
| **CourseAddress** | Embedded value object | YES | Addresses are reusable (club members, course locations), need geographic queries |
| **CourseCoordinates** | Embedded value object | YES | Coordinates used for mapping, distance calculations, separate indexed entity |
| **CourseContact** | Embedded value object | NO | Truly unstructured metadata, rarely queried independently, flatten into Course |
| **CourseSpecifications** | Embedded value object | YES | Specifications frequently referenced in scoring/handicap calculations |
| **CourseMetadata** | Embedded value object | YES | Metadata (architect, style) useful for filtering/UI, needs indexing |
| **PlayingConditions** | Embedded value object | YES | Conditions change seasonally, track history over time |
| **Facilities** | Embedded value object | NO | Simple boolean flags, rarely queried, keep as JSON in Course |
| **CourseHole** | Repeating group | YES | Core scorecard entity, many-to-one relationship with Course, scorecard calculations |
| **CourseTee** | Repeating group | YES | Rating/slope calculations, handicap index generation |
| **TeeHoleYardage** | Implied repeating group | YES | Tee-specific yardages for each hole (many-to-many-to-many relationship) |

### Decision Summary

**Normalize into separate tables:**
1. Course (root)
2. CourseAddress
3. CourseCoordinates  
4. CourseSpecifications
5. CourseMetadata
6. PlayingConditions (with season/date tracking)
7. CourseHole
8. CourseTee
9. TeeHoleYardage (tee-specific yardages per hole)

**Keep as JSON in Course table:**
- Facilities (simple boolean flags)
- Contact (rarely queried independently)

---

## Part 3: Proposed Relational Schema

### Table Definitions

#### Course (Root Aggregate)
```sql
CREATE TABLE courses (
  id              TEXT PRIMARY KEY,
  externalId      INTEGER UNIQUE NOT NULL,          -- GolfCourseAPI ID
  name            STRING NOT NULL,
  clubName        STRING,
  contactWebsite  STRING,
  contactPhone    STRING,
  facilities      JSONB,                            -- { drivingRange, puttingGreen, shortGameArea }
  par             INTEGER,                          -- Total course par
  totalYardage    INTEGER,                          -- Total course yardage
  
  -- Relationships
  addressId       TEXT UNIQUE REFERENCES course_addresses(id),
  coordinatesId   TEXT UNIQUE REFERENCES course_coordinates(id),
  specificationsId TEXT UNIQUE REFERENCES course_specifications(id),
  metadataId      TEXT UNIQUE REFERENCES course_metadata(id),
  
  createdAt       TIMESTAMP DEFAULT now(),
  updatedAt       TIMESTAMP,
  deletedAt       TIMESTAMP,
  
  INDEX externalId,
  INDEX name,
  INDEX deletedAt
);
```

#### CourseAddress
```sql
CREATE TABLE course_addresses (
  id              TEXT PRIMARY KEY,
  courseId        TEXT NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
  city            STRING,
  state           STRING,
  country         STRING,
  
  createdAt       TIMESTAMP DEFAULT now(),
  updatedAt       TIMESTAMP,
  
  INDEX (courseId),
  INDEX (country),
  INDEX (state)
);
```

#### CourseCoordinates
```sql
CREATE TABLE course_coordinates (
  id              TEXT PRIMARY KEY,
  courseId        TEXT NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
  latitude        DECIMAL(10, 8) NOT NULL,
  longitude       DECIMAL(11, 8) NOT NULL,
  
  createdAt       TIMESTAMP DEFAULT now(),
  updatedAt       TIMESTAMP,
  
  INDEX (courseId),
  INDEX (latitude, longitude),               -- For geographic queries
  CONSTRAINT valid_coordinates CHECK (
    latitude >= -90 AND latitude <= 90 AND
    longitude >= -180 AND longitude <= 180
  )
);
```

#### CourseSpecifications
```sql
CREATE TABLE course_specifications (
  id              TEXT PRIMARY KEY,
  courseId        TEXT NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
  par             INTEGER,
  totalYardage    INTEGER,
  courseRating    DECIMAL(5, 1),              -- Difficulty rating
  slopeRating     INTEGER,                    -- Slope (75-155 typical)
  
  createdAt       TIMESTAMP DEFAULT now(),
  updatedAt       TIMESTAMP,
  
  INDEX (courseId),
  INDEX (par),
  INDEX (slopeRating)
);
```

#### CourseMetadata
```sql
CREATE TABLE course_metadata (
  id              TEXT PRIMARY KEY,
  courseId        TEXT NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
  architect       STRING,
  yearBuilt       INTEGER,
  courseStyle     STRING,                     -- Enum: LINKS, PARKLAND, DESERT, etc.
  
  createdAt       TIMESTAMP DEFAULT now(),
  updatedAt       TIMESTAMP,
  
  INDEX (courseId),
  INDEX (courseStyle),
  INDEX (architect)
);
```

#### PlayingConditions (with temporal tracking)
```sql
CREATE TABLE playing_conditions (
  id              TEXT PRIMARY KEY,
  courseId        TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  grassTypeFairway STRING,                    -- Enum: BENT, BERMUDA, POA, RYE, ZOYSIA, FESCUE, OTHER
  grassTypeGreen  STRING,                     -- Same enum
  greenSize       STRING,                     -- Descriptive: "Small", "Medium", "Large"
  greenSpeed      STRING,                     -- e.g., "Stimp 12"
  elevation       INTEGER,                    -- Feet above sea level
  observedAt      TIMESTAMP NOT NULL,         -- When conditions were observed
  
  createdAt       TIMESTAMP DEFAULT now(),
  updatedAt       TIMESTAMP,
  
  INDEX (courseId),
  INDEX (courseId, observedAt),               -- Retrieve latest conditions
  INDEX (observedAt)                          -- Historical queries
);
```

#### CourseHole
```sql
CREATE TABLE course_holes (
  id              TEXT PRIMARY KEY,
  courseId        TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  holeNumber      INTEGER NOT NULL,           -- 1-18
  par             INTEGER,
  yardage         INTEGER,
  handicap        INTEGER,                    -- Stroke index (1-18)
  
  createdAt       TIMESTAMP DEFAULT now(),
  updatedAt       TIMESTAMP,
  
  INDEX (courseId),
  INDEX (courseId, holeNumber),               -- Composite for scoring
  UNIQUE (courseId, holeNumber),              -- One record per hole
  CONSTRAINT valid_hole_number CHECK (holeNumber >= 1 AND holeNumber <= 18)
);
```

#### CourseTee
```sql
CREATE TABLE course_tees (
  id              TEXT PRIMARY KEY,
  courseId        TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name            STRING NOT NULL,            -- "Championship", "Member", "Red", etc.
  color           STRING,
  gender          STRING,                     -- "M" | "F" | "Mixed"
  totalYardage    INTEGER,
  rating          DECIMAL(5, 1),
  slope           INTEGER,
  
  createdAt       TIMESTAMP DEFAULT now(),
  updatedAt       TIMESTAMP,
  
  INDEX (courseId),
  INDEX (courseId, gender),                   -- For handicap lookups
  INDEX (name),
  UNIQUE (courseId, name)                     -- One tee box per name per course
);
```

#### TeeHoleYardage (Many-to-Many-to-Many: Tees × Holes × Yardages)
```sql
CREATE TABLE tee_hole_yardages (
  id              TEXT PRIMARY KEY,
  teeId           TEXT NOT NULL REFERENCES course_tees(id) ON DELETE CASCADE,
  holeId          TEXT NOT NULL REFERENCES course_holes(id) ON DELETE CASCADE,
  courseId        TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,  -- Denormalized for query efficiency
  yardage         INTEGER,
  handicap        INTEGER,                    -- Stroke index from this tee
  
  createdAt       TIMESTAMP DEFAULT now(),
  updatedAt       TIMESTAMP,
  
  INDEX (teeId),
  INDEX (holeId),
  INDEX (courseId),
  INDEX (teeId, holeId),                      -- Composite for efficient lookups
  UNIQUE (teeId, holeId),                     -- One yardage per tee per hole
  CONSTRAINT valid_courseId CHECK (
    courseId IN (
      SELECT courseId FROM course_tees WHERE id = teeId
    ) AND
    courseId IN (
      SELECT courseId FROM course_holes WHERE id = holeId
    )
  )
);
```

---

## Part 4: Prisma Model Definitions

```prisma
// Course root aggregate
model Course {
  id                  String    @id @default(cuid())
  externalId          Int       @unique                 // GolfCourseAPI ID
  name                String
  clubName            String?
  contactWebsite      String?
  contactPhone        String?
  facilities          Json?                            // { drivingRange, puttingGreen, shortGameArea }
  
  // One-to-one relationships (child aggregates)
  address             CourseAddress?
  coordinates         CourseCoordinates?
  specifications      CourseSpecifications?
  metadata            CourseMetadata?
  
  // One-to-many relationships
  playingConditions   PlayingConditions[]
  holes               CourseHole[]
  tees                CourseTee[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?
  
  @@index([externalId])
  @@index([name])
  @@index([deletedAt])
  @@map("courses")
}

model CourseAddress {
  id                  String    @id @default(cuid())
  courseId            String    @unique
  course              Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  city                String?
  state               String?
  country             String?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([courseId])
  @@index([country])
  @@index([state])
  @@map("course_addresses")
}

model CourseCoordinates {
  id                  String    @id @default(cuid())
  courseId            String    @unique
  course              Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  latitude            Decimal   @db.Decimal(10, 8)
  longitude           Decimal   @db.Decimal(11, 8)
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([courseId])
  @@index([latitude, longitude])
  @@map("course_coordinates")
}

model CourseSpecifications {
  id                  String    @id @default(cuid())
  courseId            String    @unique
  course              Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  par                 Int?
  totalYardage        Int?
  courseRating        Decimal?  @db.Decimal(5, 1)
  slopeRating         Int?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([courseId])
  @@index([par])
  @@index([slopeRating])
  @@map("course_specifications")
}

model CourseMetadata {
  id                  String    @id @default(cuid())
  courseId            String    @unique
  course              Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  architect           String?
  yearBuilt           Int?
  courseStyle         String?                   // CourseStyle enum
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([courseId])
  @@index([courseStyle])
  @@index([architect])
  @@map("course_metadata")
}

model PlayingConditions {
  id                  String    @id @default(cuid())
  courseId            String
  course              Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  grassTypeFairway    String?                   // GrassType enum
  grassTypeGreen      String?                   // GrassType enum
  greenSize           String?
  greenSpeed          String?
  elevation           Int?
  observedAt          DateTime  @db.Timestamp
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([courseId])
  @@index([courseId, observedAt])
  @@index([observedAt])
  @@map("playing_conditions")
}

model CourseHole {
  id                  String    @id @default(cuid())
  courseId            String
  course              Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  holeNumber          Int
  par                 Int?
  yardage             Int?
  handicap            Int?
  
  // Relationships
  teeYardages         TeeHoleYardage[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@unique([courseId, holeNumber])
  @@index([courseId])
  @@index([courseId, holeNumber])
  @@map("course_holes")
}

model CourseTee {
  id                  String    @id @default(cuid())
  courseId            String
  course              Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  name                String                    // "Championship", "Member", etc.
  color               String?
  gender              String?                   // "M" | "F" | "Mixed"
  totalYardage        Int?
  rating              Decimal?  @db.Decimal(5, 1)
  slope               Int?
  
  // Relationships
  holeYardages        TeeHoleYardage[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@unique([courseId, name])
  @@index([courseId])
  @@index([courseId, gender])
  @@map("course_tees")
}

model TeeHoleYardage {
  id                  String    @id @default(cuid())
  teeId               String
  tee                 CourseTee @relation(fields: [teeId], references: [id], onDelete: Cascade)
  
  holeId              String
  hole                CourseHole @relation(fields: [holeId], references: [id], onDelete: Cascade)
  
  courseId            String                    // Denormalized for query efficiency
  course              Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  yardage             Int?
  handicap            Int?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@unique([teeId, holeId])
  @@index([teeId])
  @@index([holeId])
  @@index([courseId])
  @@index([teeId, holeId])
  @@map("tee_hole_yardages")
}
```

---

## Part 5: Data Lineage & Dependencies

```
GolfCourseAPI Response
  └─ Course (root)
      ├─ CourseAddress
      ├─ CourseCoordinates
      ├─ CourseSpecifications
      ├─ CourseMetadata
      ├─ PlayingConditions[]
      │   └─ Multiple conditions per course (seasonal/temporal)
      ├─ CourseHole[]
      │   └─ 1-18 holes per course
      │       └─ TeeHoleYardage[] (one per tee)
      │           └─ CourseTee[] reference
      └─ CourseTee[]
          └─ TeeHoleYardage[] (one per hole)
              └─ CourseHole[] reference
```

---

## Part 6: Importer Responsibilities

The importer must:

1. **Fetch course details** from GolfCourseAPI.getCourseDetails(courseId)
2. **Parse root Course** → insert into courses table
3. **Parse & upsert CourseAddress** → insert one-to-one
4. **Parse & upsert CourseCoordinates** → insert one-to-one
5. **Parse & upsert CourseSpecifications** → insert one-to-one
6. **Parse & upsert CourseMetadata** → insert one-to-one
7. **Insert PlayingConditions** → one record with `observedAt = now()`
8. **Batch insert CourseHole records** → one per hole (1-18)
9. **Batch insert CourseTee records** → one per tee box
10. **Batch insert TeeHoleYardage records** → cross product (holes × tees)

---

## Part 7: Database Health Monitoring

Row count queries:

```sql
SELECT 
  'courses' as table_name, COUNT(*) as row_count FROM courses
UNION ALL
SELECT 'course_addresses', COUNT(*) FROM course_addresses
UNION ALL
SELECT 'course_coordinates', COUNT(*) FROM course_coordinates
UNION ALL
SELECT 'course_specifications', COUNT(*) FROM course_specifications
UNION ALL
SELECT 'course_metadata', COUNT(*) FROM course_metadata
UNION ALL
SELECT 'playing_conditions', COUNT(*) FROM playing_conditions
UNION ALL
SELECT 'course_holes', COUNT(*) FROM course_holes
UNION ALL
SELECT 'course_tees', COUNT(*) FROM course_tees
UNION ALL
SELECT 'tee_hole_yardages', COUNT(*) FROM tee_hole_yardages;
```

Expected counts after full import:
- courses: N (unique courses)
- course_addresses: N (one per course)
- course_coordinates: N (one per course)
- course_specifications: N (one per course)
- course_metadata: N (one per course)
- playing_conditions: N (at least one per course)
- course_holes: N × 18 (18 holes per course)
- course_tees: N × M (M tee boxes per course, typically 3-6)
- tee_hole_yardages: N × 18 × M (cartesian product)

---

## Part 8: Admin UI Requirements

Create admin pages to browse each normalized table:

### 1. Courses Browser
- Table with columns: externalId, name, clubName, country, city
- Filtering: by country, state, clubName, name
- Sorting: by name, externalId, createdAt
- Detail view: full course info + related aggregates

### 2. Course Detail View (Sub-pages)
- Course Overview (general info)
- Address & Location (with map)
- Specifications & Ratings
- Metadata (architect, style, yearBuilt)
- Holes Grid (18 holes with par/yardage/handicap)
- Tees Browser (tee boxes)

### 3. Tees Browser (filterable by course)
- Table: name, color, gender, totalYardage, rating, slope
- Link to TeeHoleYardages

### 4. Holes Browser (filterable by course)
- Table: holeNumber, par, yardage, handicap
- Link to TeeHoleYardages for that hole

### 5. TeeHoleYardages Browser
- Table: teeName, holeNumber, yardage, handicap
- Filterable by tee, hole, course
- Comparison view: all tees for one hole

### 6. PlayingConditions History
- Timeline of conditions for each course
- Grass types, green speed changes over time

---

## Implementation Roadmap

1. **Phase 1: Schema Creation**
   - Create Prisma models (all 9 models above)
   - Generate & run migration

2. **Phase 2: Importer Updates**
   - Update importCourseIntelligence() to populate all tables
   - Add batch operations for holes, tees, teeYardages

3. **Phase 3: Database Health**
   - Add row count queries to Database Health view
   - Create summary statistics

4. **Phase 4: Admin Browsers**
   - Create Courses admin page
   - Create Course Detail view with sub-pages
   - Create Tees, Holes, TeeHoleYardages browsers
   - Create PlayingConditions history view

5. **Phase 5: Relationship Navigation**
   - Add links between related entities
   - Create breadcrumbs for navigation

---

## Key Design Principles

✓ **Fully Normalized** - No JSON nesting of reusable entities  
✓ **Temporal Tracking** - PlayingConditions tracked over time  
✓ **Query Efficient** - Composite and single-column indexes  
✓ **Referential Integrity** - Cascade deletes, unique constraints  
✓ **Denormalization Where Needed** - courseId in TeeHoleYardage for efficiency  
✓ **Audit Trails** - createdAt/updatedAt on all tables  
✓ **Soft Deletes** - deletedAt on Course (for historical data)
