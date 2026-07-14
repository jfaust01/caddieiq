# Contributing — CaddieIQ

This guide explains how work gets from an idea to production. CaddieIQ is
developed through a prompt-driven workflow layered on top of standard Git and
GitHub practices.

---

## Development Workflow

At a high level:

1. **Define the change** — a prompt or issue describing the desired outcome.
2. **Implement** — via v0 or locally, following the architecture and standards.
3. **Open a Pull Request** — against `main` from a feature branch.
4. **Review** — code review against the checklist below.
5. **Merge & deploy** — merging to `main` deploys automatically to Vercel.

### Local setup

```bash
pnpm install     # install dependencies
pnpm dev         # run the dev server at http://localhost:3000
pnpm lint        # type-check and lint before pushing
pnpm build       # verify a production build
```

## Prompt Process

CaddieIQ is extended primarily through structured prompts (via v0). A good prompt:

- **States intent, not implementation** — describe the outcome and constraints.
- **Names boundaries** — what may and may not change (routes, UI, existing code).
- **References the docs** — point to the relevant module in
  [FEATURES.md](./FEATURES.md) or layer in [ARCHITECTURE.md](./ARCHITECTURE.md).
- **Respects the layering** — data logic in services/actions, domain UI in
  `features/`, generic UI in `components/`.
- **Requests documentation updates** — every functional change should update the
  relevant `docs/` file and [CHANGELOG.md](./CHANGELOG.md).

Prompts that touch data, auth, or billing should reference [DATABASE.md](./DATABASE.md)
and the appropriate integration before writing code.

## GitHub Workflow

- The repository is linked to v0 and Vercel; commits land on branches and deploy
  on merge to `main`.
- Never commit directly to `main`. All changes flow through pull requests.
- Keep commits focused and messages descriptive (see below).

### Commit messages

Use clear, imperative messages. Conventional Commits are encouraged:

```
feat(models): add weighted input editor
fix(dashboard): correct metric card alignment
docs: add database schema reference
chore(deps): bump next to 16.2.6
```

## Branching Strategy

| Branch | Purpose |
| --- | --- |
| `main` | Production. Protected. Auto-deploys on merge. |
| `feat/*` | New features. |
| `fix/*` | Bug fixes. |
| `chore/*` | Tooling, dependencies, maintenance. |
| `docs/*` | Documentation-only changes. |

Branch from `main`, keep branches short-lived, and rebase or merge `main` in
before opening a PR to minimize conflicts.

## Pull Requests

Every PR should:

- Target `main` from a feature branch.
- Have a descriptive title and a summary of **what** changed and **why**.
- Stay scoped — one logical change per PR.
- Pass `pnpm lint` and `pnpm build` locally.
- Update documentation and the changelog when behavior changes.
- Include before/after screenshots for UI changes.

### PR checklist

- [ ] Follows [CODING_STANDARDS.md](./CODING_STANDARDS.md).
- [ ] Route pages stay thin; logic lives in features/services.
- [ ] Uses design tokens and existing components (no ad-hoc styles).
- [ ] Types added to `types/`; input validated with Zod in `validators/`.
- [ ] Accessible (semantic HTML, ARIA, keyboard support).
- [ ] Empty, loading, and error states handled.
- [ ] Docs and `CHANGELOG.md` updated.

## Code Reviews

Reviewers evaluate:

| Area | What to check |
| --- | --- |
| **Correctness** | Does it do what the PR says, without regressions? |
| **Architecture** | Is code in the right layer? Are concerns separated? |
| **Consistency** | Does it match existing patterns and the design system? |
| **Accessibility** | Semantic markup, ARIA, keyboard and screen-reader support. |
| **Performance** | Server-first rendering, no unnecessary client code or fetches. |
| **Safety** | Input validated; user-scoped data access; no leaked secrets. |

Authors should respond to every comment and re-request review after changes.
Prefer small, reviewable PRs over large ones.

## Testing

Testing infrastructure grows with the product. Current expectations:

- **Type checking** — `pnpm lint` must pass; strict TypeScript is the first line
  of defense.
- **Manual verification** — exercise the affected route in the browser, including
  empty, loading, and error states, in both light and dark themes.
- **Build verification** — `pnpm build` must succeed before merge.

As data and business logic land, add:

- **Unit tests** for services, the model engine, and utilities.
- **Integration tests** for server actions and data access.
- **Component/E2E tests** for critical user flows (model building, rankings).
