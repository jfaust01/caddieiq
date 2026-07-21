# CaddieIQ Folder Ownership Guide

**Documented:** July 20, 2026  
**Audience:** All engineers  
**Purpose:** Define folder responsibilities, allowed/forbidden dependencies, and ownership

---

## `/app` - Next.js App Router

**Owner:** Frontend Architecture Team  
**Purpose:** Route definitions, page rendering, API route handlers

### Structure
```
app/
├── (app)/              # Protected routes (auth required)
├── (auth)/             # Public auth routes (no auth required)
├── api/                # REST API endpoints
├── actions/            # Server Actions (mutations)
├── admin/              # Admin setup tools
└── setup/              # Initial setup flow
```

### Allowed Dependencies
- React components from `components/`
- Feature modules from `features/`
- Domain types from `lib/domain/`
- Services from `lib/services/`
- Utilities from `lib/utils/`
- Hooks from `hooks/` and `features/*/hooks/`

### Forbidden Dependencies
- Direct database queries (use repositories)
- Intelligence calculations (use services + intelligence domains)
- Provider API calls (use import system)
- Business logic (use services)
- Direct Prisma client usage

### Guidelines
- Keep pages thin; use feature components
- Delegate business logic to services
- Use Server Components by default; `use client` only when needed
- Validate input before calling services
- Return consistent HTTP response formats

---

## `/components` - Reusable UI Components

**Owner:** Design Systems Team  
**Purpose:** Shared presentation components

### Structure
```
components/
├── auth/               # Authentication UI
├── cards/              # Card layouts
├── charts/             # Data visualization
├── empty-states/       # No-data states
├── feedback/           # Notifications, dialogs
├── layout/             # Layout primitives
├── loaders/            # Loading states
├── navigation/         # Navigation UI
├── shared/             # Utility components
└── ui/                 # Shadcn components
```

### Allowed Dependencies
- Other components in `components/`
- Types from `lib/types/` and `lib/domain/`
- Utilities from `lib/utils/`
- External UI libraries (Shadcn, Lucide, Radix)

### Forbidden Dependencies
- Services (pass data as props)
- Repositories (use parent container)
- Intelligence logic (use parent container)
- Feature-specific code (keep generic)

### Guidelines
- Accept all data as props
- No data fetching inside components
- Render only; no side effects
- Prefer compound components
- Document props with JSDoc

---

## `/features` - Feature Modules

**Owner:** Feature Team (squad ownership)  
**Purpose:** Feature-scoped business logic, components, hooks, services

### Structure (Each Feature)
```
features/[feature]/
├── components/         # Feature UI
├── hooks/              # Feature data/state
├── services/           # Feature business logic
├── types/              # Feature types
├── utils/              # Feature utilities
└── index.ts            # Public exports
```

### Allowed Dependencies
- Global components from `components/`
- Global utilities from `lib/utils/`
- Services from `lib/services/`
- Intelligence domains from `lib/*-intelligence/`
- Other feature modules (with care)
- Domain models from `lib/domain/`

### Forbidden Dependencies
- Direct database access (use repositories)
- Provider API calls (use import system)
- Other feature's private implementation
- App-level routes

### Guidelines
- Encapsulate feature logic
- Export only public API from `index.ts`
- Keep internal implementation private
- Use feature-scoped types (don't mix with global types)
- Minimize dependencies on other features

### Feature Teams
- **Admin:** `features/admin/` - Ownership: Admin Team
- **Caddie:** `features/caddie/` - Ownership: AI Team
- **Tournaments:** `features/tournaments/` - Ownership: Tournament Team
- **Players:** `features/players/` - Ownership: Player Team
- **Rankings:** `features/rankings/` - Ownership: Rankings Team
- **Analytics:** `features/analytics/` - Ownership: Analytics Team
- **Courses:** `features/courses/` - Ownership: Course Team
- **Model Lab:** `features/model-lab/` - Ownership: ML Team

---

## `/lib` - Business Logic Layer

### `/lib/domain` - Domain Models

**Owner:** Domain Team  
**Purpose:** Canonical business object representations

**Responsibilities:**
- Type definitions
- Constants and enums
- Provider mappers (raw API → domain)
- Domain invariants (planned)

**Allowed Dependencies:**
- Other domain models
- Shared utilities

**Forbidden Dependencies:**
- Repositories
- Services
- Providers (providers call INTO mappers, not the reverse)

**Content:**
```
domain/
├── player/
├── course/
├── tournament/
├── field/
├── round/
├── round-statistic/
├── news/
├── betting/
├── fantasy/
├── statistics/
├── shared/
└── index.ts              # Public API
```

### `/lib/repositories` - Data Access Layer

**Owner:** Database Team  
**Purpose:** All database queries occur here

**Responsibilities:**
- Prisma interactions
- Idempotent upsert by slug
- Bulk operations
- Relationship resolution
- Error handling

**Allowed Dependencies:**
- Prisma client
- Domain models from `lib/domain/`
- Repository utilities

**Forbidden Dependencies:**
- Services
- Intelligence logic
- Business rules (queries only)
- Features

**Pattern:**
```typescript
// Base class
export abstract class BaseRepository { /* ... */ }

// Concrete repository
export class PlayerRepository extends BaseRepository {
  async upsertPlayer(player: Player) { /* ... */ }
}
```

### `/lib/services` - Orchestration Layer

**Owner:** Architecture Team  
**Purpose:** Service orchestration, business rule application

**Responsibilities:**
- Coordinate repository calls
- Apply domain rules
- Call intelligence domains
- Coordinate external integrations

**Allowed Dependencies:**
- Repositories
- Domain models
- Intelligence domains
- Other services

**Forbidden Dependencies:**
- Direct database access
- Provider API calls (use import system)
- Presentation logic

### `/lib/[domain]-intelligence` - Intelligence Domains

**Owner:** Data Science Team  
**Purpose:** Specialized analytical domains

**Examples:**
- `lib/course-intelligence/` - Course fit, characteristics
- `lib/player-intelligence/` - Skill ratings, projections
- `lib/dfs-value/` - Fantasy points, salary efficiency
- `lib/odds-intelligence/` - Betting models
- `lib/weather-intelligence/` - Weather impact
- `lib/analytics/` - Statistical analysis

**Responsibilities:**
- Domain-specific calculations
- Confidence/probability models
- Explanations and reasoning
- Caching and optimization

**Allowed Dependencies:**
- Domain models
- Analytics utilities
- Other intelligence domains
- Repositories (for data access)

**Forbidden Dependencies:**
- API routes
- Components
- External APIs (except via repositories/import system)

### `/lib/providers` - External Data Sources

**Owner:** Integrations Team  
**Purpose:** Isolated external API adapters

**Structure:**
```
providers/
├── sportsdataio/       # SportsDataIO
├── golfcourseapi/      # GolfCourseAPI
├── weather/            # Weather API
├── datagolf/           # DataGolf
├── odds/               # Odds provider
├── geocoding/          # Geocoding API
├── shared/             # Common utilities
├── provider.ts         # Base class
└── index.ts            # Public API
```

**Responsibilities:**
- API authentication
- Request/response handling
- Error handling and retry
- Rate limiting
- Response typing (provider-specific)

**Allowed Dependencies:**
- HTTP client (fetch, axios)
- External API SDKs
- Shared provider utilities

**Forbidden Dependencies:**
- Repositories
- Services
- Domain models (providers don't "know" about our domain)
- Other providers (except for shared utilities)

**Exports:**
- Only typed raw responses, never domain models
- Exception: Through mappers in `lib/domain/`

### `/lib/imports` - Import System

**Owner:** Data Pipeline Team  
**Purpose:** Orchestrate external data into database

**Structure:**
```
imports/
├── [domain]-import.ts       # Domain-specific importers
├── [domain]-relations.ts    # Relationship builders
├── import-manager.ts        # Orchestrator
├── import-logger.ts         # Logging
├── import-result.ts         # Result tracking
├── import-errors.ts         # Error types
└── index.ts                 # Public API
```

**Responsibilities:**
- Call providers via provider layer
- Map to domain models
- Validate (planned)
- Call repositories to persist
- Build relationships
- Log results

**Allowed Dependencies:**
- Providers
- Domain models
- Repositories
- Import utilities

**Forbidden Dependencies:**
- Services (except for specialized services like mapping confidence)
- Presentation logic

### `/lib/analytics` - Analytics Utilities

**Owner:** Analytics Team  
**Purpose:** Statistical calculations and analysis

**Categories:**
- `course-fit/` - Course-fit models
- `recent-form/` - Recent performance analysis
- `momentum/` - Trend analysis
- `strokes-gained/` - StatsBomb/DataGolf integration
- `value/` - Player value calculation
- `wind/` - Wind impact models
- `consistency/` - Consistency metrics
- `shared/` - Shared utilities

**Allowed Dependencies:**
- Domain models
- Other analytics modules
- Repositories (for data)

**Forbidden Dependencies:**
- API routes
- Components
- Features

---

## `/hooks` - Global React Hooks

**Owner:** Frontend Architecture Team  
**Purpose:** Reusable React hooks

**Guidelines:**
- Use for global state (user, auth, theme)
- Use for fetching patterns
- Don't duplicate feature-scoped hooks

### Common Hooks
- `useUser()` - Current user
- `useAuth()` - Authentication state
- `useTheme()` - Theme management

---

## `/lib/utils` - Global Utilities

**Owner:** Architecture Team  
**Purpose:** Shared utility functions

**Categories:**
- `date.ts` - Date formatting/manipulation
- `cn.ts` - Class name merging (Tailwind)
- `string.ts` - String manipulation
- `object.ts` - Object utilities
- `fetch.ts` - HTTP utilities
- `types.ts` - Type utilities

**Guidelines:**
- Pure functions only
- No side effects
- Well-tested
- Documented

---

## `/lib/types` - Global Types

**Owner:** Architecture Team  
**Purpose:** Global TypeScript types and interfaces

**Content:**
- API response types
- Shared DTOs
- Utility types
- Type guards

**Guidelines:**
- Don't mix with domain models
- Keep minimal
- Document complex types

---

## `/prisma` - Database Schema

**Owner:** Database Team  
**Purpose:** Prisma schema definition

**Structure:**
```
prisma/
├── schema.prisma        # Prisma schema
├── migrations/          # Version-controlled migrations
├── seed.ts              # Database seeding (dev)
└── README.md            # Database documentation
```

**Conventions:**
- CUID primary keys
- Snake_case table names
- Audit fields: `createdAt`, `updatedAt`
- Slug-based unique constraints

---

## `/public` - Static Assets

**Owner:** DevOps Team  
**Purpose:** Publicly served static files

**Content:**
- Favicons
- Robots.txt
- Manifest files
- Static images

---

## `/docs` - Documentation

**Owner:** Tech Writer / Architects  
**Purpose:** Platform documentation

**Structure:**
```
docs/
├── Platform_Architecture.md   # This file's sibling
├── Folder_Ownership.md        # This file
├── Architecture_Rules.md      # Architectural rules
├── Domain_Inventory.md        # Domain catalog
├── External_Integrations.md   # Integration documentation
├── README.md                  # Quick start
└── [other docs]/
```

---

## `/scripts` - Utility Scripts

**Owner:** DevOps Team  
**Purpose:** Database, import, admin utilities

**Examples:**
- Database seeding
- Import orchestration
- Admin operations
- Data migration scripts

**Guidelines:**
- Version controlled
- Well-documented
- Use TypeScript when possible
- Safe to run multiple times

---

## Cross-Folder Guidelines

### When to Create New Folders

1. **New Feature:** Create `features/[feature-name]/`
2. **New Intelligence Domain:** Create `lib/[domain]-intelligence/`
3. **New Provider:** Add to `lib/providers/[provider-name]/`
4. **New Global Utility:** Add to `lib/utils/` or `lib/types/`
5. **New Repository:** Add to `lib/repositories/`

### When NOT to Create New Folders

- Don't create folders for single utilities (add to existing)
- Don't create nested feature modules (keep one level)
- Don't duplicate functionality across features
- Don't create "utils" folders inside features (keep minimal)

### Circular Dependency Prevention

**Forbidden Patterns:**
```
// ❌ Feature imports from app/
// ❌ Repository imports from feature/
// ❌ Intelligence imports from api/
// ❌ Provider imports from repository
// ❌ Domain mapper imports from repository
```

**Allowed Patterns:**
```
// ✅ app/ imports features/
// ✅ features/ imports lib/services
// ✅ services imports repositories + intelligence
// ✅ Intelligence imports repositories
// ✅ Importers import providers + repositories + domain
```

---

## Ownership Checklist

When creating or modifying a folder:

- [ ] Assign owner team
- [ ] Document purpose
- [ ] Document allowed/forbidden dependencies
- [ ] Document public API (exports)
- [ ] Add README.md if complex
- [ ] Link from this file
- [ ] Update architecture diagram
- [ ] Communicate ownership to team

