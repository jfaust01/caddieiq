# Architecture Decision Records — Roadmap

**Future Decisions for CaddieIQ**  
**Status: Planning Phase**

---

## Planned ADRs

### 024: GraphQL API (Q3 2026)
**Context:** Current REST API works, but GraphQL would allow flexible queries  
**Options:** GraphQL Server, Hasura, or REST-only  
**Status:** Pending project growth

### 025: Real-Time Updates (Q3 2026)
**Context:** Leaderboards and live tournament scores need updates  
**Options:** WebSockets, Server-Sent Events, or polling  
**Status:** Pending feature prioritization

### 026: File Storage (Q4 2026)
**Context:** Tournament photos, course images, scorecards  
**Options:** Vercel Blob, AWS S3, or database  
**Status:** Pending feature scope

### 027: Analytics & Reporting (Q4 2026)
**Context:** Dashboard reports, player stats, performance trends  
**Options:** Self-built, Tableau, or Metabase  
**Status:** Pending business requirements

### 028: Mobile App (2027)
**Context:** Native iOS/Android vs React Native vs Progressive Web App  
**Options:** Native, React Native, PWA, or Flutter  
**Status:** Pending strategic decision

### 029: Multi-Tenancy (2027)
**Context:** Supporting multiple tournaments/organizations  
**Options:** Database-per-tenant, schema-per-tenant, or row-level  
**Status:** Pending business model clarity

### 030: Internationalization (2027)
**Context:** Supporting multiple languages and locales  
**Options:** i18next, Crowdin, or manual translation  
**Status:** Pending market expansion

---

## Potentially Needed ADRs

- **Machine Learning** — Using ML for golf handicap/ranking predictions
- **Notification System** — Email, SMS, push notifications
- **Payment Processing** — Stripe integration for tournament fees
- **Search** — Elasticsearch for searching tournaments/players
- **CDN** — Cloudflare or similar for static content
- **Audit Logging** — Compliance and data governance
- **Blue-Green Deployments** — Zero-downtime updates
- **Disaster Recovery** — Backup and recovery procedures

---

## Decisions Deferred

| Decision | Reason | Timeline |
|----------|--------|----------|
| GraphQL | REST sufficient for current needs | Q3 2026 |
| Mobile | Web-first approach | 2027 |
| Multi-tenancy | Single tournament focus | 2027 |
| i18n | English-only launch | 2027 |

---

## Decision Criteria

Before creating new ADR, ask:

1. **Is this a major decision?** (affects multiple teams/areas)
2. **Will this stick around?** (lasting consequence)
3. **Are there real alternatives?** (not just obvious choice)
4. **Do we need documentation?** (non-obvious tradeoffs)

If all yes → Create ADR  
If mostly no → Just document in code comments

---

**Last Updated:** 2026-07-20

