# Testing Standards

**Phase:** 15.3C — Platform Engineering Standards

---

## Coverage Targets

- Repositories: 85%+ coverage
- Services: 80%+ coverage
- API routes: 75%+ coverage
- Components: 70%+ coverage
- Builders: 95%+ coverage

---

## Testing Pyramid

```
      UI Tests (E2E)
        ↑
    Integration Tests
        ↑
      Unit Tests
```

---

## Test Organization

```typescript
// Repository test
describe('PlayerRepository', () => {
  describe('findById', () => {
    it('returns player when found', async () => { ... })
    it('returns error when not found', async () => { ... })
  })
})

// Service test
describe('PlayerService', () => {
  describe('getProfile', () => {
    it('returns profile with samples', async () => { ... })
    it('returns unavailable when no samples', async () => { ... })
  })
})
```

