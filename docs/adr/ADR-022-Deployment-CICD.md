# ADR-022: Deployment and CI/CD Pipeline

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** DevOps Team  

---

## Context

CaddieIQ requires:
- Automated testing on every push
- Build validation
- Automated deployment to production
- Rollback capability

---

## Decision

**Use GitHub Actions for CI/CD, Vercel for hosting.**

1. **CI** — GitHub Actions tests and builds
2. **CD** — Automatic deployment to Vercel
3. **Preview** — Preview deployments on PRs
4. **Staging** — Staging environment for QA
5. **Production** — Production deployment

---

## GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: caddieiq_test
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm install
      
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      
      - run: npm run build
```

---

## Vercel Deployment

```toml
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database_url",
    "BETTER_AUTH_SECRET": "@better_auth_secret"
  }
}
```

---

## Consequences

### ✓ Positive

- Automated testing (catch bugs early)
- Preview deployments (review changes)
- Automatic production deployment
- Easy rollback

### ✗ Negative

- Requires GitHub Actions knowledge
- CI/CD can be slow
- Increased complexity

---

## Related ADRs

- ADR-017: Testing strategy
- ADR-018: Environment variables

