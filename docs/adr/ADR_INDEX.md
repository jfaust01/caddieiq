# Architecture Decision Records — Complete Index

**CaddieIQ ADR Library**  
**Version 2.0 | 23 Decisions | 2026-07-20**

---

## Quick Navigation

### By Category
- [Core Architecture](#core-architecture-5-adrs)
- [Infrastructure & Database](#infrastructure-database-4-adrs)
- [Frontend & UI](#frontend-ui-4-adrs)
- [API & Data](#api-data-3-adrs)
- [Quality & Operations](#quality-operations-7-adrs)

### By Reading Level
- [Beginner](#recommended-reading-for-new-developers)
- [Intermediate](#intermediate)
- [Advanced](#advanced)

---

## Core Architecture (5 ADRs)

| # | Title | Status | Why | When |
|---|-------|--------|-----|------|
| 001 | [Feature-Based Architecture](ADR-001-Feature-Based-Architecture.md) | ✅ | Organize by business domain | Starting new features |
| 002 | [Intelligence Versioned Builds](ADR-002-Intelligence-Versioned-Builds.md) | ✅ | Safe algorithm updates | Building intelligence engines |
| 003 | [Repositories No Business Logic](ADR-003-Repositories-No-Business-Logic.md) | ✅ | Clear separation of concerns | Writing data access code |
| 004 | [Deterministic UTC Formatting](ADR-004-Deterministic-UTC-Formatting.md) | ✅ | Consistency across timezones | Working with dates/times |
| 005 | [Result<T> Return Type](ADR-005-ResultT-Standard-Return-Type.md) | ✅ | Forced error handling | All function signatures |

---

## Infrastructure & Database (4 ADRs)

| # | Title | Status | Why | When |
|---|-------|--------|-----|------|
| 009 | [Neon + Better Auth Stack](ADR-009-Neon-BetterAuth-Stack.md) | ✅ | Serverless Postgres + modern auth | Database operations |
| 010 | [Drizzle ORM Type Safety](ADR-010-Drizzle-ORM-Type-Safety.md) | ✅ | Compile-time query safety | Writing queries |
| 018 | [Environment Variables](ADR-018-Environment-Variable-Management.md) | ✅ | Type-safe secrets | Configuration |
| 019 | [Data Security & Validation](ADR-019-Data-Security-Validation.md) | ✅ | Multi-layer protection | Handling user data |

---

## Frontend & UI (4 ADRs)

| # | Title | Status | Why | When |
|---|-------|--------|-----|------|
| 011 | [Next.js App Router + RSC](ADR-011-NextJS-AppRouter-RSC.md) | ✅ | Server-first rendering | Building pages/routes |
| 013 | [Tailwind CSS Styling](ADR-013-Tailwind-CSS-Styling.md) | ✅ | Utility-first consistency | Styling components |
| 014 | [shadcn/ui Components](ADR-014-Component-Library-ShadcnUI.md) | ✅ | Accessible, customizable | Building UI components |
| 015 | [React Query Data Fetching](ADR-015-React-Query-Data-Fetching.md) | ✅ | Client-side caching & sync | Fetching data on client |

---

## API & Data (3 ADRs)

| # | Title | Status | Why | When |
|---|-------|--------|-----|------|
| 008 | [Services Own Orchestration](ADR-008-Services-Own-Orchestration.md) | ✅ | Reusable business logic | Writing service methods |
| 012 | [API Response Standardization](ADR-012-API-Response-Standardization.md) | ✅ | Consistent response format | Building API endpoints |
| 021 | [Caching Strategy](ADR-021-Caching-Strategy.md) | ✅ | Multi-layer performance | Optimizing response times |

---

## Quality & Operations (7 ADRs)

| # | Title | Status | Why | When |
|---|-------|--------|-----|------|
| 006 | [Active-Build Pointers](ADR-006-Active-Build-Pointers.md) | ✅ | Atomic version switching | Managing versioned builds |
| 007 | [Builders Pure Functions](ADR-007-Builders-Are-Pure-Functions.md) | ✅ | Deterministic calculations | Writing intelligence builders |
| 016 | [TypeScript Strict Mode](ADR-016-TypeScript-Strict-Mode.md) | ✅ | Compile-time safety | Code quality |
| 017 | [Testing with Vitest](ADR-017-Testing-Strategy-Vitest.md) | ✅ | Regression prevention | Writing tests |
| 020 | [Monitoring & Error Tracking](ADR-020-Monitoring-Error-Tracking.md) | ✅ | Production visibility | Debugging issues |
| 022 | [Deployment & CI/CD](ADR-022-Deployment-CICD.md) | ✅ | Automated testing & deploy | Deploying code |
| 023 | [Documentation & Runbooks](ADR-023-Documentation-Runbooks.md) | ✅ | Knowledge preservation | System documentation |

---

## Decision Matrix

### By Layer

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│  ADR-011 (App Router) | ADR-013 (Tailwind) | ADR-014 (UI)    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ADR-001 (Architecture) | ADR-008 (Services) | ADR-007 (Builders)
│  ADR-005 (Result<T>) | ADR-002 (Versioning)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Data Access Layer                        │
│  ADR-003 (Repositories) | ADR-010 (Drizzle) | ADR-004 (UTC)  │
│  ADR-021 (Caching)                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ADR-009 (Neon+Auth) | ADR-018 (Env Vars) | ADR-019 (Security)
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Operations & Quality                       │
│  ADR-012 (API) | ADR-015 (Data Fetch) | ADR-016 (TypeScript)│
│  ADR-017 (Tests) | ADR-020 (Monitoring) | ADR-022 (CI/CD)    │
│  ADR-006 (Pointers) | ADR-023 (Documentation)               │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommended Reading for New Developers

### Phase 1: Foundation (Read in order, 1 hour)
1. **[ADR-001](ADR-001-Feature-Based-Architecture.md)** — How we organize code
2. **[ADR-003](ADR-003-Repositories-No-Business-Logic.md)** — How we separate concerns
3. **[ADR-005](ADR-005-ResultT-Standard-Return-Type.md)** — How we handle errors
4. **[ADR-008](ADR-008-Services-Own-Orchestration.md)** — How we orchestrate logic

### Phase 2: Technology Stack (Read as needed, 2 hours)
5. **[ADR-009](ADR-009-Neon-BetterAuth-Stack.md)** — Database & auth setup
6. **[ADR-010](ADR-010-Drizzle-ORM-Type-Safety.md)** — How we query data
7. **[ADR-011](ADR-011-NextJS-AppRouter-RSC.md)** — How we build pages
8. **[ADR-013](ADR-013-Tailwind-CSS-Styling.md)** & **[ADR-014](ADR-014-Component-Library-ShadcnUI.md)** — How we style UI

### Phase 3: Quality & Operations (Read for specific tasks)
9. **[ADR-016](ADR-016-TypeScript-Strict-Mode.md)** — Type safety
10. **[ADR-017](ADR-017-Testing-Strategy-Vitest.md)** — Writing tests
11. **[ADR-020](ADR-020-Monitoring-Error-Tracking.md)** — Production issues
12. **[ADR-022](ADR-022-Deployment-CICD.md)** — Deploying changes

---

## Intermediate

Read these when working in specific areas:

- **Intelligence Features** → ADR-002, ADR-006, ADR-007
- **Database Work** → ADR-010, ADR-021
- **API Development** → ADR-012, ADR-015
- **Security** → ADR-018, ADR-019
- **Performance** → ADR-021, ADR-020

---

## Advanced

Read these when making architectural decisions:

- **All ADRs** — Understand full system
- **[ADR_ROADMAP](ADR_ROADMAP.md)** — Future decisions
- **Cross-references** — See "Related ADRs" section in each ADR
- **Decision patterns** — Notice patterns across ADRs

---

## Cross-Reference Matrix

```
ADR-001 references: ADR-003, ADR-008, ADR-011
ADR-002 references: ADR-006, ADR-007, ADR-004
ADR-003 references: ADR-001, ADR-005, ADR-008
ADR-004 references: ADR-002, ADR-007, ADR-001
ADR-005 references: ADR-001, ADR-003, ADR-008
ADR-006 references: ADR-002, ADR-001
ADR-007 references: ADR-002, ADR-004, ADR-006
ADR-008 references: ADR-001, ADR-003, ADR-005
ADR-009 references: ADR-005, ADR-010, ADR-004
ADR-010 references: ADR-009, ADR-005, ADR-003
ADR-011 references: ADR-001, ADR-008, ADR-005
ADR-012 references: ADR-005, ADR-008, ADR-011
ADR-013 references: ADR-011, ADR-001
ADR-014 references: ADR-013, ADR-001
ADR-015 references: ADR-011, ADR-012
ADR-016 references: ADR-010, ADR-005
ADR-017 references: ADR-007, ADR-005
ADR-018 references: ADR-009
ADR-019 references: ADR-018, ADR-005
ADR-020 references: ADR-018
ADR-021 references: ADR-015, ADR-002
ADR-022 references: ADR-017, ADR-018
ADR-023 references: All ADRs
```

---

## Finding the Right ADR

### "How do I...?"

- **...organize my code?** → ADR-001
- **...write database queries?** → ADR-010
- **...handle errors?** → ADR-005
- **...create API endpoints?** → ADR-012, ADR-008
- **...build React components?** → ADR-011, ADR-013, ADR-014
- **...fetch data on the client?** → ADR-015
- **...write tests?** → ADR-017
- **...deploy code?** → ADR-022
- **...secure my code?** → ADR-019, ADR-018
- **...monitor production?** → ADR-020

---

## Implementation Checklist

When starting a new feature:

- [ ] Read ADR-001 (architecture)
- [ ] Follow ADR-003 (repo structure)
- [ ] Use ADR-005 (error handling)
- [ ] Write tests per ADR-017
- [ ] Handle security per ADR-019
- [ ] Reference in code review (link ADRs)

---

## Updating ADRs

When making architectural changes:

1. **Create new ADR** if new decision
2. **Update existing ADR** if changing decision
3. **Update cross-references** in related ADRs
4. **Update this index** if adding/removing ADRs
5. **Update [ADR_ROADMAP](ADR_ROADMAP.md)** with implications

---

## Document Generation

```bash
# Count all ADRs
ls -1 ADR-*.md | wc -l

# Get total lines
wc -l ADR-*.md | tail -1

# Search for topic
grep -l "database" ADR-*.md

# Generate decision summary
grep "^# ADR" ADR-*.md | sed 's/:.*$//' | sort
```

---

**Status:** All 23 ADRs Complete  
**Last Updated:** 2026-07-20  
**Maintained By:** Architecture Team

