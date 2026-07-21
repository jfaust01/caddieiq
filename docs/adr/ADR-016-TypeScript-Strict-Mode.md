# ADR-016: TypeScript Strict Mode

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Code Quality Team  

---

## Context

TypeScript offers strict mode to catch more errors at compile time. Question: Should all code run in strict mode?

---

## Decision

**Enable TypeScript strict mode globally. No exceptions.**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

---

## Consequences

### ✓ Positive

- Catches type errors at compile time
- Reduces runtime errors
- Better IDE support and autocomplete
- Documents intent (function signatures)
- Prevents entire classes of bugs

### ✗ Negative

- More verbose type annotations
- Steeper learning curve for new developers
- Slower initial development

---

## Related ADRs

- ADR-010: Drizzle ORM type safety
- ADR-005: Result<T> standard return type

