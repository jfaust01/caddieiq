# ADR Summary: The "Why" Behind CaddieIQ Architecture

**8 Architecture Decision Records | 52KB Documentation | 2026-07-20**

This collection captures the reasoning behind CaddieIQ's key architectural decisions. Each ADR explains:
- **Why** the decision was made
- **What** was chosen
- **Why** alternatives were rejected
- **How** to implement the pattern
- **What** tradeoffs to expect

---

## The 8 Key Decisions

### 1️⃣ **Feature-Based Architecture** (ADR-001)
- **Problem:** How to organize code for a multi-domain application?
- **Answer:** By business domain, not technical layer
- **Pattern:** `lib/domain/tournament/`, `lib/domain/course/`, `lib/domain/player/`, etc.
- **Why:** Teams can own entire domains, features stay colocated, easier to scale

### 2️⃣ **Versioned Intelligence Builds** (ADR-002)
- **Problem:** How to update calculations safely?
- **Answer:** Build versions first, then promote to active
- **Pattern:** v1 → v2 → v3 (active) with instant rollback
- **Why:** Safe updates, A/B testing, traceability, instant rollback if issues

### 3️⃣ **Repositories = Data Only** (ADR-003)
- **Problem:** Where should business logic live?
- **Answer:** In services, not repositories
- **Pattern:** Repository queries → Service calculates → API returns
- **Why:** Reusable logic, testable, clear separation of concerns

### 4️⃣ **UTC Timestamps Only** (ADR-004)
- **Problem:** How to handle timezones consistently?
- **Answer:** All timestamps in UTC, returned as ISO 8601
- **Pattern:** Store UTC → Return ISO 8601 → Client converts to local
- **Why:** Global consistency, database reliability, determinism across regions

### 5️⃣ **Result<T> Return Type** (ADR-005)
- **Problem:** How to handle errors consistently?
- **Answer:** Return Result<T> instead of throwing or null
- **Pattern:** `{ ok: true; data: T }` or `{ ok: false; error }`
- **Why:** Forced error handling, clear semantics, rich error information

### 6️⃣ **Active-Build Pointers** (ADR-006)
- **Problem:** How to track which intelligence version is active?
- **Answer:** Each build points to the active version
- **Pattern:** Build self-references as "active"
- **Why:** Atomic switches, no race conditions, easy rollback, audit trail

### 7️⃣ **Pure Function Builders** (ADR-007)
- **Problem:** How to make calculations reproducible and testable?
- **Answer:** Builders are pure functions (no side effects)
- **Pattern:** `(samples, population) → Result<Profile>` (no I/O)
- **Why:** Deterministic, testable, easy to version, safe to parallelize

### 8️⃣ **Services Own Orchestration** (ADR-008)
- **Problem:** Where should workflow logic live?
- **Answer:** In services, not controllers
- **Pattern:** API (thin) → Service (orchestration) → Repository (data)
- **Why:** Reusable logic, testable, clean separation, easy to enhance

---

## Quick Reference

| ADR | Decision | Pattern | Benefit |
|-----|----------|---------|---------|
| 001 | Feature-based | Domain folders | Team scalability |
| 002 | Versioned builds | v1, v2, v3... active | Safe updates |
| 003 | Repos data-only | Repo → Service split | Reusability |
| 004 | UTC timestamps | Always UTC, ISO 8601 | Global consistency |
| 005 | Result<T> | { ok, data/error } | Forced handling |
| 006 | Active pointers | Build → active | Atomic switches |
| 007 | Pure functions | No side effects | Reproducible |
| 008 | Service orchestration | Service coordinates | Reusable logic |

---

## The Philosophy

These 8 ADRs express 5 core principles:

1. **Clear Boundaries** — Each layer has one job (ADR-001, ADR-003, ADR-008)
2. **Explicit Handling** — Never hide failures (ADR-005)
3. **Reproducible Calculations** — Same input = Same output (ADR-004, ADR-007)
4. **Safe Updates** — Can always roll back (ADR-002, ADR-006)
5. **Reusable Logic** — Write once, use everywhere (ADR-003, ADR-008)

---

## How to Use These ADRs

### When Starting a Feature
1. Read ADR-001 (how should I organize code?)
2. Read relevant ADRs for your layer (Repo = ADR-003, Service = ADR-008)
3. Follow the patterns shown in implementation examples

### When Reviewing Code
1. Check which ADRs apply to the code
2. Verify the pattern is being followed
3. Reference the ADR when suggesting improvements

### When Onboarding
1. Read all 8 ADRs as introduction to philosophy
2. Understand the 5 core principles above
3. Reference ADRs as you develop features

### When Making New Decisions
1. Read these 8 ADRs first (understand existing decisions)
2. Consider if an ADR should be created
3. Format: `ADR-009-Title-With-Hyphens.md`
4. Include: Context, Decision, Rationale, Alternatives, Consequences

---

## Related Documentation

- **Engineering_Standards.md** — How to implement these decisions
- **Dependency_Rules.md** — Enforces ADR-001, ADR-003
- **Domain_Ownership.md** — Organizes by ADR-001
- **Repository_Standards.md** — Implements ADR-003, ADR-005
- **Service_Standards.md** — Implements ADR-008
- **Builder_Standards.md** — Implements ADR-007
- **Architecture_Diagrams.md** — Visualizes all ADRs

---

## Anti-Patterns to Avoid

🚫 **ADR-001 Violation:** Organizing code by layer instead of domain
- Wrong: `lib/services/player.ts`, `lib/models/player.ts`, `lib/controllers/player.ts`
- Right: `lib/domain/player/service.ts`, `lib/domain/player/repository.ts`

🚫 **ADR-003 Violation:** Business logic in repository
- Wrong: `playerRepository.calculateSkill()` (calculation)
- Right: `playerRepository.getSamples()` then `playerService.calculateSkill()`

🚫 **ADR-004 Violation:** Storing timestamps in local time
- Wrong: `new Date()` (client timezone), `getLocaleDateString()`
- Right: `new Date(...).toISOString()` (UTC)

🚫 **ADR-005 Violation:** Throwing errors instead of Result<T>
- Wrong: `if (!data) throw new Error('Not found')`
- Right: `if (!data) return { ok: false, error: ... }`

🚫 **ADR-007 Violation:** Builder with side effects
- Wrong: `buildProfile(samples) { saveToDatabase(...); return profile }`
- Right: `buildProfile(samples) { return profile }` (orchestrate in service)

🚫 **ADR-008 Violation:** Fat controller
- Wrong: API route contains validation, calculations, orchestration
- Right: API route calls service, service does everything

---

## Implementation Checklist

Before committing code, verify:

- [ ] Code organized by domain (ADR-001)
- [ ] No business logic in repositories (ADR-003)
- [ ] All functions return Result<T> (ADR-005)
- [ ] All timestamps in UTC (ADR-004)
- [ ] Intelligence builders are pure functions (ADR-007)
- [ ] Services orchestrate, APIs are thin (ADR-008)
- [ ] No builder side effects (ADR-007)
- [ ] Tests follow patterns shown in ADRs

---

## Future ADRs

When you make new architectural decisions, create a new ADR:

- ADR-009 — ???
- ADR-010 — ???

Follow the same format:
- Context
- Decision
- Rationale
- Alternatives Considered
- Consequences
- Related ADRs
- Implementation Examples
- Anti-Patterns

---

## Questions?

Each ADR has:
- **Context** section (why this mattered)
- **Rationale** section (why this choice)
- **Consequences** section (tradeoffs)
- **Implementation Examples** (how to follow)
- **Anti-Patterns** (what NOT to do)

Read the full ADR if you need details.

---

**Status:** All 8 ADRs Accepted  
**Location:** `/docs/adr/`  
**Version:** 1.0  
**Last Updated:** 2026-07-20
