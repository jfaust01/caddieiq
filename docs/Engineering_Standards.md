# CaddieIQ Engineering Standards

**Phase:** 15.3C — Platform Engineering Standards & Domain Architecture  
**Status:** Complete  
**Date:** 2026-07-20  
**Scope:** Official engineering handbook for all CaddieIQ development

---

## Executive Summary

This document establishes the engineering standards, architectural principles, and development conventions that guide all CaddieIQ development. These standards ensure consistency, maintainability, and quality across the platform.

All future code must conform to these standards. Deviations require architecture review and explicit exception documentation.

---

## Core Architectural Principles

### 1. **Layered Architecture**
```
Presentation Layer (React Components, Next.js Pages)
        ↓
API Layer (Route handlers, validation)
        ↓
Service Layer (Business logic, orchestration)
        ↓
Repository Layer (Data access, queries)
        ↓
Database Layer (Prisma ORM, PostgreSQL)
```

**Rule:** Each layer must only communicate with the layer directly below it.

### 2. **Domain-Driven Design**
The platform organizes around 12 major domains (see Domain_Ownership.md).

**Rule:** Each domain owns its repositories, services, and UI components.

### 3. **Pure Functions for Calculations**
All intelligence engines use pure functions: identical input → identical output, no side effects.

**Rule:** Intelligence builders must be pure functions with no external calls.

### 4. **Honest "Unavailable" Pattern**
Rather than fabricate data, services return explicit unavailable states.

**Rule:** Never return null, undefined, or fake data without honest communication.

### 5. **Request-Level Deduplication**
Services use React `cache()` pattern to deduplicate identical requests within one request lifecycle.

**Rule:** Wrap services with React `cache()` to prevent duplicate database calls.

### 6. **Server-Only Security**
All core services must use `server-only` import to prevent client bundling.

**Rule:** Services containing business logic or secrets must import `'server-only'`.

### 7. **Idempotent Operations**
All imports and updates use upsert patterns (insert-on-conflict-update).

**Rule:** Operations must be safe to re-run without side effects.

### 8. **Explicit Error Handling**
Every layer implements consistent error handling with logging and recovery strategies.

**Rule:** All errors must be caught, logged, and handled appropriately.

---

## Development Workflow

### Phase 1: Requirements & Architecture Review
- Document feature requirements
- Identify affected domains
- Review dependency implications
- Get architecture approval

### Phase 2: Design
- Update affected domain schemas (if DB changes needed)
- Design service layer
- Plan repository changes
- Document error scenarios

### Phase 3: Implementation
- Follow coding conventions (Coding_Conventions.md)
- Implement repositories first (Repository_Standards.md)
- Implement services (Service_Standards.md)
- Implement API routes (API_Standards.md)
- Implement UI components (Component_Standards.md)

### Phase 4: Testing
- Unit tests for repositories (Repository_Standards.md)
- Unit tests for services (Service_Standards.md)
- Integration tests for workflows
- E2E tests for critical paths

### Phase 5: Documentation
- Update README if public API changes
- Document new error codes
- Update architecture diagrams if needed
- Add inline code comments for complexity

### Phase 6: Code Review
- Architecture review for layer violations
- Testing verification
- Security review
- Performance review

### Phase 7: Deployment & Verification
- Deploy to staging
- Run production verification tests
- Monitor error rates
- Gather metrics

---

## Critical Constraints

### DO NOT

❌ Call Prisma directly from components  
❌ Call Prisma directly from services (use repositories)  
❌ Embed business logic in repositories  
❌ Embed presentation logic in services  
❌ Create circular dependencies between domains  
❌ Store secrets in code (use environment variables)  
❌ Fabricate data (return "unavailable" instead)  
❌ Bypass error handling  
❌ Skip testing  
❌ Commit code without documentation  

### DO

✓ Use repositories for all data access  
✓ Use services for business logic  
✓ Use React components for presentation  
✓ Handle all errors explicitly  
✓ Log important operations  
✓ Test critical paths  
✓ Document complex logic  
✓ Follow naming conventions  
✓ Validate user input  
✓ Request architecture review for structural changes  

---

## Quality Gates

Every feature must pass:

**Architecture Review**
- [ ] No layer violations
- [ ] No circular dependencies
- [ ] Domain ownership respected
- [ ] Dependency rules followed

**Code Review**
- [ ] Follows coding conventions
- [ ] No code duplication
- [ ] Error handling complete
- [ ] Logging appropriate
- [ ] Comments clear

**Testing**
- [ ] Unit tests: 80%+ coverage
- [ ] Integration tests for workflows
- [ ] E2E tests for critical paths
- [ ] No regression in existing tests

**Security Review**
- [ ] No secrets in code
- [ ] Input validation complete
- [ ] SQL injection prevention verified
- [ ] Authorization checks in place

**Performance Review**
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Caching strategy documented
- [ ] Load time acceptable

**Documentation Review**
- [ ] Code comments clear
- [ ] Architecture documented
- [ ] Error codes documented
- [ ] README updated if needed

---

## Metrics & Monitoring

Every feature must include monitoring for:

**Performance**
- Request latency (p50, p95, p99)
- Database query time
- API response size

**Reliability**
- Error rate by endpoint
- Error rate by domain
- Recovery time

**Business**
- Feature usage
- Conversion impact
- User satisfaction

---

## Documentation Requirements

Every feature must include:

1. **Architecture Document** - How data flows
2. **Error Codes** - All possible failures
3. **API Documentation** - Endpoints, parameters, responses
4. **Database Changes** - Schema migrations
5. **Monitoring Setup** - Alerts and dashboards
6. **Runbook** - How to troubleshoot in production
7. **Deployment Guide** - How to safely deploy

---

## Change Management

### Major Changes (Structural)
- [ ] Requires architecture review
- [ ] Requires database migration plan
- [ ] Requires security review
- [ ] Requires testing plan
- [ ] Requires rollback plan
- [ ] Requires monitoring dashboard
- [ ] Requires communication plan

### Medium Changes (Feature)
- [ ] Requires code review
- [ ] Requires testing
- [ ] Requires documentation
- [ ] Requires monitoring

### Minor Changes (Bug fix, small enhancement)
- [ ] Requires code review
- [ ] May require testing
- [ ] May require documentation

---

## Acceptance Criteria for Phase 15.3C

✅ 15 engineering standards documents completed  
✅ All architectural layers documented  
✅ All domains documented with ownership  
✅ Dependency rules established and enforced  
✅ Standards for repositories defined  
✅ Standards for services defined  
✅ Standards for builders defined  
✅ Standards for components defined  
✅ Standards for APIs defined  
✅ Standards for database defined  
✅ Testing expectations documented  
✅ Security standards documented  
✅ Coding conventions established  
✅ Future development workflow defined  
✅ 8 Mermaid diagrams created  
✅ Inconsistencies identified (not fixed)  
✅ Technical debt catalogued  

---

## Next Phase: Implementation (Phase 16)

Phase 16 will remediate architectural inconsistencies identified in Phase 15.3C:

1. **Fix layer violations** (Component → Prisma, Service → Prisma)
2. **Extract business logic** from repositories
3. **Add missing repositories** for entity types
4. **Break circular dependencies** (if any found)
5. **Implement error handling** consistently
6. **Add comprehensive testing**

All remediation will be validated against these standards.
