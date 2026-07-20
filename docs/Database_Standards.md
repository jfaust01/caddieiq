# Database Standards

**Phase:** 15.3C — Platform Engineering Standards

---

## Prisma Schema Rules

### Naming Conventions

- Models: PascalCase (`Tournament`, `PlayerSkill`)
- Fields: camelCase (`startDate`, `courseId`)
- Relations: camelCase plural (`tournaments`, `courses`)

### Relationships

```prisma
model Tournament {
  id        String    @id
  name      String
  
  // One-to-many
  courses   TournamentCourse[]
  field     TournamentField[]
  rounds    Round[]
  
  // Foreign key
  courseId  String?
  course    Course?   @relation(fields: [courseId], references: [id])
}

model TournamentField {
  id            String   @id
  tournamentId  String
  tournament    Tournament @relation(fields: [tournamentId], references: [id])
  
  playerId      String
  player        Player @relation(fields: [playerId], references: [id])
  
  @@unique([tournamentId, playerId])
}
```

### Timestamps

All entities should include:

```prisma
model Tournament {
  id        String   @id
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Migrations

All schema changes require migrations:

```bash
npx prisma migrate dev --name add_tournament_field
```

Never edit migrations manually.

