# CaddieIQ Engineering Standards Handbook

**Phase:** 15.3C — Platform Engineering Standards & Domain Architecture  
**Status:** ✅ COMPLETE  
**Created:** 2026-07-20

---

## 📚 Documentation Structure

### Core Standards (Essential Reading)

1. **[Engineering_Standards.md](Engineering_Standards.md)** 📖
   - Executive summary
   - Core architectural principles
   - Development workflow (7 phases)
   - Quality gates
   - Acceptance criteria

2. **[Dependency_Rules.md](Dependency_Rules.md)** 🔗
   - Architectural layers
   - Dependency hierarchy
   - Allowed vs forbidden patterns
   - Layer violation detection
   - Circular dependency prevention

3. **[Domain_Ownership.md](Domain_Ownership.md)** 🏢
   - 12 major domains mapped
   - Domain responsibilities
   - Cross-domain dependencies
   - Repository/Service ownership
   - External providers

### Implementation Standards

4. **[Repository_Standards.md](Repository_Standards.md)** 💾
   - Repository responsibilities
   - Standard interface
   - Error handling patterns
   - Transactions & caching
   - Pagination & filtering
   - Testing requirements

5. **[Service_Standards.md](Service_Standards.md)** ⚙️
   - Business logic orchestration
   - Request-level deduplication
   - Server-only security
   - Error handling
   - Logging patterns
   - Testing patterns

6. **[Builder_Standards.md](Builder_Standards.md)** 🧠
   - Pure function requirements
   - Intelligence engine standards
   - Determinism testing
   - Versioning strategies
   - Confidence metrics
   - Testing requirements

7. **[Component_Standards.md](Component_Standards.md)** 🎨
   - Component types (presentational, container, feature)
   - Server vs client components
   - State handling
   - Performance optimization
   - Folder structure

### API & Database Standards

8. **[API_Standards.md](API_Standards.md)** 🔌
   - Thin controller pattern
   - Response format
   - Status codes
   - Input validation
   - Error codes
   - Logging

9. **[Database_Standards.md](Database_Standards.md)** 🗄️
   - Prisma schema rules
   - Naming conventions
   - Relationships & migrations
   - Timestamps

### Quality & Security

10. **[Testing_Standards.md](Testing_Standards.md)** ✅
    - Coverage targets (80%+ for services)
    - Testing pyramid (unit → integration → E2E)
    - Test organization
    - Minimum coverage expectations

11. **[Security_Standards.md](Security_Standards.md)** 🔒
    - Secrets management
    - Input validation
    - SQL injection prevention
    - Authentication patterns
    - Authorization checks

12. **[Performance_Standards.md](Performance_Standards.md)** ⚡
    - Database optimization
    - N+1 query prevention
    - Caching strategy
    - Server components usage
    - Index requirements

### Development & Governance

13. **[Coding_Conventions.md](Coding_Conventions.md)** 📝
    - Naming conventions
    - File organization
    - Import organization
    - Comment guidelines
    - Error message standards

14. **[Architecture_Governance.md](Architecture_Governance.md)** 👮
    - Governance framework
    - Architecture review checklist
    - Exception process
    - Metrics & monitoring
    - Escalation process
    - Approval authority

15. **[Future_Development_Guide.md](Future_Development_Guide.md)** 🚀
    - Recommended workflow (9 steps)
    - Checklist for new features
    - Phase-by-phase guidance
    - Best practices

### Visual Documentation

16. **[Architecture_Diagrams.md](Architecture_Diagrams.md)** 📊
    - 8 Mermaid diagrams
    - Platform layers
    - Dependency hierarchy
    - Domain ownership
    - Request lifecycle
    - Service coordination
    - Intelligence architecture
    - Error handling flow
    - Data flow examples

---

## 🎯 Quick Start

### If you're implementing a new feature:
1. Read [Engineering_Standards.md](Engineering_Standards.md) — Overview
2. Read [Domain_Ownership.md](Domain_Ownership.md) — Which domain?
3. Read [Dependency_Rules.md](Dependency_Rules.md) — How to structure
4. Read implementation standards for your layer (Repository, Service, Component, etc.)
5. Follow [Future_Development_Guide.md](Future_Development_Guide.md)

### If you're reviewing code:
1. Use [Architecture_Governance.md](Architecture_Governance.md) — Review checklist
2. Check [Dependency_Rules.md](Dependency_Rules.md) — Layer violations?
3. Verify implementation standards match the layer
4. Check testing coverage
5. Verify security & performance

### If you're adding a new domain:
1. Read [Domain_Ownership.md](Domain_Ownership.md) — Current domains
2. Define repositories (follow [Repository_Standards.md](Repository_Standards.md))
3. Define services (follow [Service_Standards.md](Service_Standards.md))
4. Update [Domain_Ownership.md](Domain_Ownership.md)
5. Document external dependencies

---

## 📊 Architecture Overview

### Layers

```
🎨 Presentation Layer (Components)
   ↓
🔌 API Layer (Route Handlers)
   ↓
⚙️ Service Layer (Business Logic)
   ↓
📊 Repository Layer (Data Access)
   ↓
🗄️ Database Layer (PostgreSQL)
```

### Domains

| Category | Domains |
|----------|---------|
| **Core Business** | Tournament, Course, Player, Field, Weather, News, DFS/Betting, Rankings |
| **Intelligence** | Player Skill, Course Intelligence, Weather Intelligence, DFS Value, Odds Intelligence |
| **Platform** | Authentication, Administration, Data Quality, Shared Utilities |

### Quality Standards

| Layer | Coverage | Priority |
|-------|----------|----------|
| Repositories | 85%+ | Critical |
| Services | 80%+ | Critical |
| API Routes | 75%+ | High |
| Components | 70%+ | Medium |
| Builders | 95%+ | Critical |

---

## ✅ Phase 15.3C Completion

### Deliverables

✅ **15 Engineering Standards Documents**
- Engineering_Standards.md
- Dependency_Rules.md
- Domain_Ownership.md
- Repository_Standards.md
- Service_Standards.md
- Builder_Standards.md
- Component_Standards.md
- API_Standards.md
- Database_Standards.md
- Testing_Standards.md
- Security_Standards.md
- Performance_Standards.md
- Coding_Conventions.md
- Architecture_Governance.md
- Future_Development_Guide.md

✅ **8 Mermaid Diagrams**
- Platform Layers
- Dependency Hierarchy
- Domain Ownership
- Request Lifecycle
- Service Coordination
- Intelligence Architecture
- Error Handling Flow
- Data Flow Example

✅ **Comprehensive Coverage**
- All architectural layers documented
- All domains documented
- All dependency rules established
- All implementation standards defined
- All quality gates specified
- Governance framework complete

---

## 🔄 Next Phase: 16 - Implementation

Phase 16 will remediate architectural inconsistencies:

1. Fix layer violations (Component → Prisma, Service → Prisma)
2. Extract business logic from repositories
3. Add missing repositories for entity types
4. Break circular dependencies (if found)
5. Implement error handling consistently
6. Add comprehensive testing

All remediation will validate against these standards.

---

## 📞 Questions?

This handbook is the source of truth for CaddieIQ development. All future code must conform to these standards.

For questions or clarifications:
1. Check the relevant standard document
2. Review Architecture_Diagrams.md for visual explanation
3. Follow Future_Development_Guide.md for workflow questions
4. Consult Architecture_Governance.md for review/approval questions

---

**Standards Version:** 1.0  
**Last Updated:** 2026-07-20  
**Maintained By:** Architecture Team

