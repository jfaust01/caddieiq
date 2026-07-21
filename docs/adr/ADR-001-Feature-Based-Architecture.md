# ADR-001: Feature-Based Architecture

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Architecture Team  

---

## Context

CaddieIQ needed to structure a complex domain application with multiple independent feature areas (tournaments, courses, players, intelligence, DFS, weather, etc.). Two main approaches were considered:

1. **Layer-based architecture** — Organize by technical layer (models/, services/, controllers/)
2. **Feature-based architecture** — Organize by business domain (tournament/, course/, player/, intelligence/)

---

## Decision

**Adopt feature-based architecture** organized by business domain.

```
lib/
  domain/
    tournament/        # All tournament logic
    course/           # All course logic
    player/           # All player logic
  
  analytics/
    dfs-value/        # DFS value calculations
    course-fit/       # Course fit analysis
  
  intelligence/
    player-skill/     # Player skill engine
    course/           # Course intelligence engine
```

---

## Rationale

### ✓ Advantages

1. **Team Scalability**
   - Teams can own entire domains without touching others
   - Clear ownership boundaries reduce coordination overhead
   - Parallel development possible

2. **Feature Isolation**
   - Easier to reason about a feature when all code is colocated
   - Related repositories, services, types in one place
   - Change scope is bounded

3. **Onboarding**
   - New team members can focus on one domain
   - Reduces cognitive load vs. 50+ generic services

4. **Service Extraction**
   - If domain grows, easier to extract as microservice
   - Clear API boundaries already defined

5. **Reduced Coupling**
   - Layer-based encourages horizontal coupling (many services share repository)
   - Feature-based encourages vertical relationships
   - More independent modules

### ✗ Disadvantages of Layer-Based

1. **Too Generic** — Hard to find logic related to player
2. **High Coupling** — Services share repositories horizontally
3. **Distributed Changes** — One feature change touches 5+ locations
4. **Harder Ownership** — No clear "who owns player feature"
5. **Microservice Trap** — Difficult to extract when needed

---

## Alternatives Considered

### Alternative 1: Pure Layer-Based
```
lib/
  models/
  services/
  repositories/
```
**Rejected:** Too generic, high coupling, distributed changes.

### Alternative 2: Domain + Layer Hybrid
```
lib/
  domain/
    tournament/
      models/
      services/
      repositories/
```
**Considered but rejected:** Adds unnecessary nesting, we keep models/services/repositories at domain level.

### Alternative 3: Functional/Slice-Based
```
lib/
  create-tournament/
  update-tournament/
  get-tournament/
```
**Rejected:** Too granular, creates verb explosion, hard to find related code.

---

## Consequences

### ✓ Positive

- Clear domain boundaries
- Easy to find related code
- Teams can work independently
- Easier to extract services later
- Self-documenting architecture

### ✗ Negative

- Requires discipline to avoid cross-domain coupling
- Shared utilities must live somewhere (we use `/lib/shared/`)
- Slightly more imports (but worth it)
- New team members need orientation to domain layout

---

## Related ADRs

- ADR-003: Repository patterns prevent cross-domain coupling
- ADR-005: Result<T> enables consistent error handling across domains

---

## Implementation Notes

- Each domain owns its repositories
- Services call repositories within their domain
- Cross-domain calls only through services (no repository-to-repository)
- Shared utilities live in `/lib/shared/`, `/lib/utils/`, `/lib/constants/`
- Types live with the domain they represent

