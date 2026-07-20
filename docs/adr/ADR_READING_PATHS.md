# Architecture Decision Records — Reading Paths

**Curated reading journeys through the ADR library based on your role**

---

## For Frontend Engineers

**Goal:** Understand UI/UX architecture and best practices  
**Time:** 3 hours  
**Order:**

1. ADR-001: Feature-Based Architecture (15 min)
   - Understand code organization
   - See how features map to directories

2. ADR-011: Next.js App Router (20 min)
   - Learn Server Components vs Client Components
   - Understand RSC benefits

3. ADR-013: Tailwind CSS (10 min)
   - Styling approach
   - Design token system

4. ADR-014: shadcn/ui (15 min)
   - Component library strategy
   - How to customize components

5. ADR-015: React Query (15 min)
   - Client-side data fetching
   - Cache management

6. ADR-012: API Response Standardization (10 min)
   - What data you're getting
   - Error handling on client

7. ADR-005: Result<T> (10 min)
   - Understanding error patterns
   - How services communicate

**Then:** Understand backend (skip if not interested)

---

## For Backend Engineers

**Goal:** Understand database, business logic, and API architecture  
**Time:** 3 hours  
**Order:**

1. ADR-001: Feature-Based Architecture (15 min)
   - Understand code organization
   - Domain ownership

2. ADR-003: Repositories No Business Logic (15 min)
   - Data access patterns
   - What goes in repository

3. ADR-008: Services Own Orchestration (15 min)
   - Business logic orchestration
   - Service coordination

4. ADR-005: Result<T> (10 min)
   - Error handling pattern
   - Used everywhere

5. ADR-009: Neon + Better Auth (15 min)
   - Database + auth stack
   - Environment setup

6. ADR-010: Drizzle ORM (20 min)
   - Type-safe queries
   - Schema management

7. ADR-012: API Response Standardization (10 min)
   - Response format
   - Error codes

8. ADR-007: Builders Pure Functions (10 min)
   - Intelligence calculation pattern

9. ADR-002: Versioned Builds (15 min)
   - How to version work

**Then:** Understand quality & operations

---

## For DevOps/Infrastructure

**Goal:** Understand deployment, monitoring, and operations  
**Time:** 2 hours  
**Order:**

1. ADR-009: Neon + Better Auth (15 min)
   - Database infrastructure
   - Auth service

2. ADR-018: Environment Variables (10 min)
   - Configuration management
   - Secrets handling

3. ADR-022: Deployment & CI/CD (15 min)
   - GitHub Actions
   - Vercel deployment

4. ADR-020: Monitoring & Error Tracking (15 min)
   - Logging strategy
   - Error tracking

5. ADR-019: Data Security & Validation (15 min)
   - Security layers
   - Input validation

6. ADR-016: TypeScript Strict Mode (10 min)
   - Build-time type safety

7. ADR-017: Testing Strategy (10 min)
   - Test coverage expectations

---

## For Security/Compliance

**Goal:** Understand security architecture and practices  
**Time:** 1.5 hours  
**Order:**

1. ADR-019: Data Security & Validation (20 min)
   - Multi-layer validation
   - Authorization patterns

2. ADR-018: Environment Variables (10 min)
   - Secrets management
   - Environment-specific config

3. ADR-009: Neon + Better Auth (15 min)
   - Database security
   - Authentication mechanism

4. ADR-004: Deterministic UTC Formatting (10 min)
   - Timestamp consistency
   - Audit trail support

5. ADR-005: Result<T> (10 min)
   - Error handling (doesn't leak details)

6. ADR-023: Documentation & Runbooks (10 min)
   - Security documentation

---

## For QA/Testing

**Goal:** Understand testing strategy and quality assurance  
**Time:** 1.5 hours  
**Order:**

1. ADR-017: Testing Strategy (20 min)
   - Vitest patterns
   - Test categories

2. ADR-007: Builders Pure Functions (15 min)
   - Why they're testable
   - Testing patterns

3. ADR-005: Result<T> (10 min)
   - Error scenarios to test

4. ADR-022: Deployment & CI/CD (15 min)
   - Automated testing
   - Release process

5. ADR-016: TypeScript Strict Mode (10 min)
   - Compile-time safety

---

## For Product Managers/Stakeholders

**Goal:** Understand system architecture and tradeoffs  
**Time:** 2 hours  
**Order:**

1. ADR-001: Feature-Based Architecture (10 min)
   - How features are organized
   - Scalability implications

2. ADR-009: Neon + Better Auth (15 min)
   - Technology choices
   - Cost implications

3. ADR-002: Versioned Builds (20 min)
   - How intelligence works
   - Update strategy

4. ADR-022: Deployment & CI/CD (15 min)
   - How often we deploy
   - Safety measures

5. ADR-020: Monitoring & Error Tracking (15 min)
   - Production visibility
   - Issue response

6. ADR-023: Documentation & Runbooks (10 min)
   - Knowledge preservation

---

## For Architects/Tech Leads

**Goal:** Understand full system and future evolution  
**Time:** 6-8 hours  
**Order:**

**Read in this order:**

1. ADR-001: Feature-Based Architecture
2. ADR-003: Repositories No Business Logic
3. ADR-005: Result<T> Return Type
4. ADR-008: Services Own Orchestration
5. ADR-007: Builders Pure Functions
6. ADR-002: Intelligence Versioned Builds
7. ADR-006: Active-Build Pointers
8. ADR-004: Deterministic UTC Formatting
9. ADR-009: Neon + Better Auth
10. ADR-010: Drizzle ORM
11. ADR-011: Next.js App Router
12. ADR-012: API Response Standardization
13. ADR-013: Tailwind CSS
14. ADR-014: shadcn/ui
15. ADR-015: React Query
16. ADR-016: TypeScript Strict Mode
17. ADR-017: Testing Strategy
18. ADR-018: Environment Variables
19. ADR-019: Data Security
20. ADR-020: Monitoring & Error Tracking
21. ADR-021: Caching Strategy
22. ADR-022: Deployment & CI/CD
23. ADR-023: Documentation

**Then:** Review [ADR_ROADMAP](ADR_ROADMAP.md) for future decisions

---

## Cross-Functional Teams

### Recommend these for everyone:

- ADR-001: Feature-Based Architecture (understand org)
- ADR-005: Result<T> (used everywhere)
- ADR-022: Deployment & CI/CD (how code ships)

### Then add your role's path above

---

**Last Updated:** 2026-07-20

EOFROADMAP

echo ""
echo "✅ Created comprehensive ADR documentation:"
echo "  - ADR_INDEX.md (Master index with decision matrix)"
echo "  - ADR_ROADMAP.md (Future planned decisions)"
echo "  - ADR_READING_PATHS.md (Role-based reading guides)"
