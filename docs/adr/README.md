# Architecture Decision Records (ADRs)

**CaddieIQ Architecture Decision Records**  
**Version 1.0 | 2026-07-20**

This directory contains the reasoning behind major architectural decisions in CaddieIQ. Each ADR captures the context, decision, rationale, and consequences of key design choices.

---

## Index of Decisions

### 1. [ADR-001 — Feature-Based Architecture](ADR-001-Feature-Based-Architecture.md)
**Why:** Organize code by business domain, not technical layer

- ✓ Team scalability (each owns a domain)
- ✓ Feature isolation (related code together)
- ✓ Reduced coupling (fewer horizontal dependencies)
- ✓ Easier microservice extraction

**Decision:** Use feature-based (tournament/, course/, player/) instead of layer-based (models/, services/, repos/)

---

### 2. [ADR-002 — Intelligence Uses Versioned Builds](ADR-002-Intelligence-Versioned-Builds.md)
**Why:** Safely update intelligence calculations with rollback capability

- ✓ Safe updates (build before switching)
- ✓ A/B testing (test new algorithm first)
- ✓ Traceability (know which version was used)
- ✓ Progressive rollout (10% → 50% → 100%)

**Decision:** Intelligence engines use numbered builds with active selection

---

### 3. [ADR-003 — Repositories Contain No Business Logic](ADR-003-Repositories-No-Business-Logic.md)
**Why:** Keep concerns separated and code reusable

- ✓ Single responsibility (Repository = data, Service = logic)
- ✓ Testability (mock repositories in service tests)
- ✓ Reusability (same repository used by many services)
- ✓ Debuggability (clear ownership of failures)

**Decision:** Repositories handle ONLY data access; services handle business logic

---

### 4. [ADR-004 — Deterministic UTC Formatting](ADR-004-Deterministic-UTC-Formatting.md)
**Why:** Ensure timestamps work correctly across timezones and databases

- ✓ Global consistency (same time everywhere)
- ✓ Database reliability (no timezone conversion bugs)
- ✓ API consistency (standard format always)
- ✓ Determinism (same input always produces same format)

**Decision:** All timestamps stored in UTC, returned as ISO 8601, never local time

---

### 5. [ADR-005 — Result<T> is the Standard Return Type](ADR-005-ResultT-Standard-Return-Type.md)
**Why:** Force explicit error handling and provide rich error information

- ✓ Forced error handling (type system requires checking)
- ✓ Clear semantics (ok: true/false, no ambiguity)
- ✓ Rich information (error codes, context, messages)
- ✓ Async-friendly (no unhandled rejections)
- ✓ Composability (easy to chain operations)

**Decision:** All functions return `Result<T>`, never throw or return null

---

### 6. [ADR-006 — Active-Build Pointers](ADR-006-Active-Build-Pointers.md)
**Why:** Safely track which intelligence version is active

- ✓ Atomic switches (instant version change)
- ✓ No boolean confusion (clear single active)
- ✓ History tracking (audit trail of changes)
- ✓ Performance (cache active version)
- ✓ Safety (deliberate promotion required)

**Decision:** Builds reference their "active" version via pointer pattern

---

### 7. [ADR-007 — Builders Are Pure Functions](ADR-007-Builders-Are-Pure-Functions.md)
**Why:** Make intelligence calculations reproducible, testable, and versionable

- ✓ Determinism (same input = same output always)
- ✓ Testability (no mocking, no database needed)
- ✓ Debugging (reproduces easily, clear stack traces)
- ✓ Performance (easy to cache and parallelize)
- ✓ Versioning (works with versioned builds)

**Decision:** Intelligence builders are pure functions (no side effects, no I/O)

---

### 8. [ADR-008 — Services Own Orchestration](ADR-008-Services-Own-Orchestration.md)
**Why:** Centralize business logic coordination for reusability and testability

- ✓ Single responsibility (API = HTTP, Service = logic, Repo = data)
- ✓ Reusability (service callable from multiple entry points)
- ✓ Testability (test business logic without HTTP)
- ✓ Maintainability (business logic in one place)
- ✓ Error handling (consistent error propagation)

**Decision:** Services orchestrate repositories, builders, and other services; API routes are thin controllers

---

## Usage

### Understanding a Decision

1. Read the **decision** section (what was chosen)
2. Review the **rationale** (why it was chosen)
3. See the **alternatives** (why others weren't chosen)
4. Understand the **consequences** (tradeoffs)

### Implementing Aligned Code

- **New repository?** Follow pattern in ADR-003, ADR-005
- **Intelligence calculation?** Follow pattern in ADR-007
- **Database timestamps?** Follow pattern in ADR-004
- **API endpoint?** Follow pattern in ADR-008
- **Creating new domain?** Follow pattern in ADR-001

### When to Create ADRs

Create an ADR when:
- Making a significant architectural decision
- Decision affects multiple teams
- Decision has lasting consequences
- Decision is non-obvious
- Team consensus required

Format: `ADR-NNN-Title-With-Hyphens.md`

---

## Related Documents

- [Engineering_Standards.md](../Engineering_Standards.md) — How to implement these decisions
- [Domain_Ownership.md](../Domain_Ownership.md) — Domains organized per ADR-001
- [Repository_Standards.md](../Repository_Standards.md) — Implements ADR-003, ADR-005
- [Service_Standards.md](../Service_Standards.md) — Implements ADR-008
- [Builder_Standards.md](../Builder_Standards.md) — Implements ADR-007
- [Architecture_Diagrams.md](../Architecture_Diagrams.md) — Visual representation of ADRs

---

## Quick Reference

| ADR | Title | Key Pattern |
|-----|-------|------------|
| 001 | Feature-Based Architecture | Domain folders (tournament/, course/, player/) |
| 002 | Versioned Builds | Version numbers with active pointer |
| 003 | No Business Logic in Repos | Repositories for data only |
| 004 | UTC Formatting | All timestamps UTC, ISO 8601 format |
| 005 | Result<T> Return Type | `{ ok: true; data: T }` or `{ ok: false; error }` |
| 006 | Active-Build Pointers | Build points to active version |
| 007 | Pure Functions | No side effects, deterministic |
| 008 | Services Own Orchestration | Services coordinate, APIs are thin |

---

**Status:** All 8 ADRs Accepted  
**Maintained By:** Architecture Team  
**Last Updated:** 2026-07-20

