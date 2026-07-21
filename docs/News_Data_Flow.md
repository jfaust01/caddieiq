# News Data Flow

**Phase:** 15.3B Documentation

## Flow Overview

```
News Provider (RSS / Web)
     ↓
NewsImporter (fetch articles)
     ↓
Deduplication (check if already imported)
     ↓
Normalizer (extract title, url, date)
     ↓
Validator (validate article)
     ↓
NewsRepository.upsert()
     ↓
NewsArticle Table
     ↓
NewsService
(Query articles for tournament)
     ↓
Tournament Detail Page (Intel tab)
```

## Database Schema

```typescript
model NewsArticle {
  id              String  @id
  url             String  @unique
  
  title           String
  summary         String?
  source          String
  author          String?
  
  publishedAt     DateTime
  fetchedAt       DateTime
  
  tags            String[]  // ["RoryMcIlroy", "Weather", "Course"]
  relevance       Int       // 1-100
}
```

## Import Pipeline

### Step 1: Fetch
**Sources:**
- PGA Tour RSS feed
- ESPN Golf RSS
- Golf.com RSS
- GolfChannel.com RSS
- Tournament-specific news

**Trigger:** Hourly during tournament

**Raw Data:**
```xml
<?xml version="1.0"?>
<rss>
  <item>
    <title>Rory McIlroy Withdraws from Cadillac Championship</title>
    <link>https://pgatour.com/article/12345</link>
    <pubDate>Wed, 12 Nov 2026 10:30:00 GMT</pubDate>
    <description>Northern Ireland golfer cites...</description>
  </item>
</rss>
```

### Step 2: Deduplicate
**Check:** Has this URL already been imported?
```typescript
const existing = await repo.findByUrl(article.url)
if (existing) {
  // Skip, already have this article
  return
}
```

### Step 3: Normalize
**Extract:**
- Title
- URL
- Published date
- Summary/description
- Source (feed name)

**Tag** (relevance detection):
- Detect player mentions (Rory McIlroy → "RoryMcIlroy")
- Detect tournament mentions
- Detect topic keywords (Weather, Injury, Weather, Odds, etc.)

### Step 4: Validate
**Checks:**
- ✓ URL is valid HTTP/HTTPS
- ✓ Title is non-empty
- ✓ Published date is recent (within 7 days)
- ✓ Not duplicate of existing article

**Failure Mode:** Reject article, log reason

### Step 5: Persist
**Repository:** `NewsRepository.create(article)`

## Filtering for Tournament

**NewsService:**
```typescript
getNewsForTournament(tournamentId: string): Promise<NewsArticle[]> {
  // Query articles tagged with tournament
  // Sort by publishedAt DESC
  // Filter published within 14 days
  // Return up to 50 articles
}
```

## API Endpoint

### GET /api/tournaments/:tournamentId/news
Returns sorted articles tagged with tournament

**Response:**
```json
[
  {
    "id": "news-1234",
    "title": "Weather Alert: Rain Expected Thursday",
    "source": "PGATour.com",
    "url": "https://pgatour.com/...",
    "publishedAt": "2026-11-12T10:30:00Z",
    "tags": ["Weather"],
    "relevance": 85
  },
  ...
]
```

## Retention & Cleanup

**Data Policy:**
- Keep articles for 90 days
- Delete older articles (manual admin cleanup)
- Deduplicate by URL

**Cleanup Job:**
```sql
DELETE FROM NewsArticle WHERE publishedAt < NOW() - INTERVAL '90 days'
```

## Failure Handling

| Failure | Handling |
|---------|----------|
| RSS feed unavailable | Try next feed, log |
| Article parsing fails | Skip article, log |
| URL extraction fails | Deduplicate by title hash |
| DB constraint violation | Update if exists |

## Refresh Strategy

- **Refresh:** Hourly during tournament
- **Retention:** 90 days
- **Deduplication:** Yes (by URL)
- **TTL:** None (historical)

