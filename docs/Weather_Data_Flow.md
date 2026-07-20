# Weather Data Flow

**Phase:** 15.3B Documentation

## Flow Overview

```
Weather Provider (OpenWeather / Fallback)
     ↓
WeatherImporter (fetch 5-day forecast)
     ↓
Normalizer (map to WeatherSnapshot/WeatherPeriod)
     ↓
Validator (validate forecast data)
     ↓
WeatherRepository.bulkUpsert()
     ↓
WeatherSnapshot + WeatherPeriod Tables
     ↓
WeatherIntelligenceService
(Fetch forecast → normalize by wave/time window)
     ↓
WeatherIntelligenceEngine
(Pure function: raw forecast → context)
     ↓
Tournament Detail Page (Intel tab, DFS calculations)
```

## Database Schema

```typescript
model WeatherSnapshot {
  id              String  @id
  tournamentId    String
  
  fetchedAt       DateTime
  forecastStart   DateTime
  forecastEnd     DateTime
  
  periods         WeatherPeriod[]
  importLog       WeatherImportLog?
}

model WeatherPeriod {
  id              String  @id
  snapshotId      String
  snapshot        WeatherSnapshot @relation(fields: [snapshotId], references: [id])
  
  period          Int      // Wave 1, 2, 3, 4
  hour            Int      // 0-23
  date            DateTime
  
  tempF           Float
  windSpeedMph    Float
  windDirection   String   // "NW", "SE", etc.
  precipChance    Float    // 0.0-1.0
  dewpoint        Float
  feelsLike       Float
  cloudCover      Float    // 0.0-1.0
}

model WeatherImportLog {
  id              String  @id
  tournamentId    String
  snapshotId      String  @unique
  
  status          "success" | "partial" | "failed"
  provider        "openweather" | "fallback"
  fetchedAt       DateTime
  nextRefresh     DateTime?
}
```

## Import Pipeline

### Step 1: Fetch Forecast
**Source:** OpenWeather API (primary), or fallback  
**Trigger:** Every 6 hours during tournament

**Raw Data:**
```json
{
  "coord": { "lon": -80.2733, "lat": 25.8006 },
  "forecast": [
    {
      "dt": 1731374400,
      "main": { "temp": 72, "feels_like": 68, "dew_point": 55 },
      "wind": { "speed": 8.5, "deg": 315 },
      "clouds": { "all": 25 },
      "pop": 0.1,
      "weather": [{ "main": "Clear" }]
    },
    ...
  ]
}
```

### Step 2: Normalize
**Normalizer:** Map OpenWeather JSON to WeatherPeriod records

**Aggregation by Wave:**
- Round 1 (e.g., 11 AM - 3 PM Day 1)
- Round 2 (e.g., 3 PM - 7 PM Day 1)
- Round 3 (e.g., 11 AM - 3 PM Day 2)
- Round 4 (e.g., 3 PM - 7 PM Day 2)

**Output:**
```typescript
{
  snapshotId: uuid(),
  tournamentId: "cadillac-championship-2026",
  periods: [
    { period: 1, avgTemp: 72, avgWind: 8, precipChance: 0.1, ... },
    { period: 2, avgTemp: 70, avgWind: 10, precipChance: 0.2, ... },
    ...
  ],
  fetchedAt: now()
}
```

### Step 3: Validate
**Checks:**
- ✓ Forecast covers tournament dates
- ✓ Temperature in reasonable range (-10 to 120°F)
- ✓ Wind speed >= 0
- ✓ Precip chance is 0.0-1.0
- ✓ At least one period per round

**Failure Mode:** Return honest "unavailable" (don't fabricate weather)

### Step 4: Persist
**Repository:** `WeatherRepository.bulkUpsert(snapshot, periods)`

## Caching & Refresh

**Cache Strategy:**
- Fetch every 6 hours (during tournament)
- Store entire snapshot + periods
- On next fetch, replace old snapshot
- Keep 14-day history

**Refresh Logic:**
```typescript
async fetchWeatherIfNeeded(tournamentId: string) {
  const lastSnapshot = await repo.findLatestSnapshot(tournamentId)
  const now = Date.now()
  const timeSinceLastFetch = now - lastSnapshot.fetchedAt.getTime()
  
  if (timeSinceLastFetch < 6 * 3600 * 1000) {
    // Cache hit, return existing
    return lastSnapshot
  }
  
  // Fetch new forecast
  const forecast = await weatherProvider.fetch(coordinates)
  const snapshot = normalize(forecast)
  await repo.bulkUpsert([snapshot])
  return snapshot
}
```

## Weather Intelligence Service

**Purpose:** Normalize raw forecast into tournament context

**Input:** WeatherSnapshot + WeatherPeriod records

**Process:**
```typescript
1. Group periods by round (wave)
2. Calculate average metrics per round:
   - Avg temperature
   - Avg wind speed + direction
   - Max precip chance
   - Cloud cover trend
3. Assign difficulty ratings:
   - Wind: 1-10 (10 = most difficult)
   - Precip: 1-10 (10 = most rain)
   - Temp: comfort rating
4. Return normalized context
```

**Output:**
```typescript
{
  tournament: "cadillac-championship-2026",
  forecast: {
    round1: {
      tempF: 72,
      windMph: 8,
      windDir: "NW",
      precipChance: 0.1,
      windDifficulty: 4,
      condition: "fair"
    },
    round2: {
      tempF: 70,
      windMph: 12,
      windDir: "N",
      precipChance: 0.3,
      windDifficulty: 6,
      condition: "challenging"
    },
    ...
  }
}
```

## API Endpoint

### GET /api/intelligence/weather/:tournamentId
Returns normalized weather context by round

## Failure Handling

**Provider Unavailable:**
- Try fallback provider
- If both fail, return "unavailable"
- UI shows "Weather data unavailable" message
- Do NOT fabricate weather

**Validation Fails:**
- Log error
- Return honest "unavailable"
- Try again in 1 hour

**Forecast Too Old:**
- If last fetch > 12 hours old
- Return stale data with warning
- UI shows "Weather data may be outdated"

## Refresh Strategy

- **Refresh:** Every 6 hours during tournament
- **Retention:** 14 days
- **Fallback:** Yes (secondary provider)
- **TTL:** 6 hours

