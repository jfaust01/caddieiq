# Sequence Diagrams

**Phase:** 15.3B Documentation

## 1. Tournament Detail Page Load

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant NextJS
    participant TournamentService
    participant CourseService
    participant PlayerSkillService
    participant WeatherService
    participant NewsService
    participant DfsService
    participant DB

    User->>Browser: Navigate to /tournaments/cadillac-2026
    Browser->>NextJS: Request page
    
    NextJS->>TournamentService: getTournamentContext(id)
    TournamentService->>DB: SELECT * FROM Tournament WHERE id
    DB-->>TournamentService: tournament row
    TournamentService-->>NextJS: TournamentContext
    
    par Course Intelligence
        NextJS->>CourseService: getCourseIntelligence(courseId)
        CourseService->>DB: SELECT * FROM CourseDetails WHERE courseId
        CourseService->>DB: SELECT * FROM CourseHole WHERE courseId
        CourseService->>DB: SELECT * FROM CourseTee WHERE courseId
        DB-->>CourseService: course data
        CourseService-->>NextJS: CourseIntelligence
    and Player Skills
        NextJS->>PlayerSkillService: getSkillProfiles(playerIds)
        PlayerSkillService->>DB: SELECT * FROM PlayerSkill WHERE playerId IN (...)
        DB-->>PlayerSkillService: skill profiles
        PlayerSkillService-->>NextJS: Map<playerId, Profile>
    and Weather
        NextJS->>WeatherService: getWeatherContext(tournamentId)
        WeatherService->>DB: SELECT * FROM WeatherSnapshot WHERE tournamentId
        DB-->>WeatherService: weather data
        WeatherService-->>NextJS: WeatherContext
    and News
        NextJS->>NewsService: getNewsForTournament(tournamentId)
        NewsService->>DB: SELECT * FROM NewsArticle WHERE tags CONTAINS tournamentId
        DB-->>NewsService: news articles
        NewsService-->>NextJS: NewsArticle[]
    end
    
    NextJS->>DfsService: calculateFieldRankings(tournamentId)
    Note over DfsService: Uses PlayerSkill + CourseIntel + Salary
    DfsService->>DB: SELECT * FROM DfsSalary WHERE tournamentId
    DfsService->>DB: SELECT * FROM OddsQuote WHERE tournamentId
    DB-->>DfsService: salary and odds data
    DfsService-->>NextJS: DFS rankings
    
    NextJS->>Browser: Render page with all data
    Browser->>User: Display Tournament Detail
```

## 2. Player Skill Profile Build

```mermaid
sequenceDiagram
    actor Admin
    participant AdminUI
    participant BuildService
    participant Repository
    participant Engine
    participant DB

    Admin->>AdminUI: Click "Build Skill Profiles"
    AdminUI->>BuildService: startBuild()
    
    BuildService->>Repository: getAllPlayers()
    Repository->>DB: SELECT * FROM Player
    DB-->>Repository: players
    Repository-->>BuildService: player list
    
    loop For each player
        BuildService->>Repository: findSamplesByPlayerId(id)
        Repository->>DB: SELECT rounds WHERE playerId
        DB-->>Repository: round samples
        
        BuildService->>Repository: loadPlatformPopulation()
        Repository->>DB: SELECT all player samples
        DB-->>Repository: population
        
        BuildService->>Engine: buildPlayerSkillProfile(samples, population)
        Engine-->>BuildService: skill profile
        
        BuildService->>DB: INSERT INTO PlayerIntelligence (...)
    end
    
    BuildService->>DB: UPDATE PlayerIntelligenceBuild SET activeBuild = NEW_VERSION
    DB-->>BuildService: success
    
    BuildService-->>AdminUI: Build complete
    AdminUI->>Admin: Show summary
```

## 3. Course Import Pipeline

```mermaid
sequenceDiagram
    participant GolfCourseAPI
    participant Importer
    participant Normalizer
    participant Validator
    participant Repository
    participant DB

    GolfCourseAPI-->>Importer: Raw course data
    
    Importer->>Normalizer: normalize(raw)
    Normalizer-->>Importer: normalized courses
    
    Importer->>Validator: validate(normalized)
    Validator-->>Importer: validation result
    
    alt Valid
        Importer->>Repository: bulkUpsert(courses)
        Repository->>DB: INSERT ... ON CONFLICT UPDATE
        DB-->>Repository: rows affected
        Repository-->>Importer: result
        Importer-->>GolfCourseAPI: Import successful
    else Invalid
        Importer-->>GolfCourseAPI: Import failed (logged)
    end
```

## 4. DFS Value Calculation (Per Request)

```mermaid
sequenceDiagram
    actor User
    participant API
    participant DfsService
    participant PlayerSkillService
    participant CourseFitService
    participant SalaryRepo
    participant Engine
    participant DB

    User->>API: GET /api/intelligence/dfs/:tournamentId
    API->>DfsService: calculateFieldRankings(tournamentId)
    
    par
        DfsService->>DB: SELECT field players WHERE tournamentId
        DB-->>DfsService: playerIds
    and
        DfsService->>PlayerSkillService: getSkillProfiles(playerIds)
        PlayerSkillService->>DB: SELECT from PlayerSkill WHERE playerId IN (...)
        DB-->>PlayerSkillService: profiles
        PlayerSkillService-->>DfsService: Map<playerId, Profile>
    and
        DfsService->>CourseFitService: getFitScores(playerIds, courseId)
        CourseFitService->>DB: SELECT course details + calculate fit
        DB-->>CourseFitService: fit scores
        CourseFitService-->>DfsService: Map<playerId, Score>
    and
        DfsService->>SalaryRepo: findSalaries(tournamentId)
        SalaryRepo->>DB: SELECT * FROM DfsSalary WHERE tournamentId
        DB-->>SalaryRepo: salaries
        SalaryRepo-->>DfsService: salary map
    end
    
    loop For each player
        DfsService->>Engine: calculateExpectedPoints(skill, fit, weather, fieldStrength)
        Engine-->>DfsService: expected points
        
        DfsService->>Engine: calculateValue(points, salary)
        Engine-->>DfsService: value score
    end
    
    DfsService->>DfsService: Sort by value DESC, calculate percentiles
    DfsService-->>API: DFS rankings
    
    API-->>User: Return JSON response
```

## 5. Weather Refresh Cycle

```mermaid
sequenceDiagram
    participant Scheduler
    participant WeatherImporter
    participant Provider
    participant Normalizer
    participant DB

    Scheduler->>WeatherImporter: Check if refresh needed
    
    WeatherImporter->>DB: SELECT * FROM WeatherSnapshot WHERE tournamentId
    DB-->>WeatherImporter: last snapshot
    
    alt Last fetch > 6 hours ago
        WeatherImporter->>Provider: fetch(courseCoordinates)
        Provider->>Provider: Call OpenWeather API
        Provider-->>WeatherImporter: raw forecast
        
        WeatherImporter->>Normalizer: normalize(raw, tournament)
        Normalizer->>Normalizer: Group by round/wave, aggregate
        Normalizer-->>WeatherImporter: normalized snapshot
        
        WeatherImporter->>DB: INSERT INTO WeatherSnapshot + WeatherPeriod
        DB-->>WeatherImporter: success
        
        WeatherImporter->>DB: UPDATE WeatherImportLog
        DB-->>WeatherImporter: success
    else Cache fresh
        WeatherImporter->>WeatherImporter: Use existing snapshot
    end
```

## 6. Viewing a Player Profile

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant NextJS
    participant PlayerService
    participant SkillService
    participant HistoryService
    participant DB

    User->>Browser: Navigate to /players/rory-mcilroy
    Browser->>NextJS: Request page
    
    NextJS->>PlayerService: getPlayerProfile(id)
    PlayerService->>DB: SELECT * FROM Player WHERE id
    DB-->>PlayerService: player row
    PlayerService-->>NextJS: Player
    
    par Skill Profile
        NextJS->>SkillService: getPlayerProfile(id)
        SkillService->>DB: SELECT * FROM PlayerSkill WHERE playerId
        DB-->>SkillService: skill data
        SkillService-->>NextJS: PlayerSkillProfile
    and Tournament History
        NextJS->>HistoryService: getTournamentHistory(id)
        HistoryService->>DB: SELECT * FROM PlayerTourHistory WHERE playerId
        DB-->>HistoryService: history
        HistoryService-->>NextJS: TourHistory[]
    and Season Stats
        NextJS->>HistoryService: getSeasonStats(id)
        HistoryService->>DB: SELECT * FROM PlayerSeasonStatistic WHERE playerId
        DB-->>HistoryService: stats
        HistoryService-->>NextJS: SeasonStats[]
    end
    
    NextJS->>Browser: Render page
    Browser->>User: Display Player Profile
```

## 7. News Deduplication on Import

```mermaid
sequenceDiagram
    participant Provider
    participant Importer
    participant Repository
    participant DB

    Provider-->>Importer: Raw articles (RSS)
    
    loop For each article
        Importer->>Repository: findByUrl(article.url)
        Repository->>DB: SELECT * FROM NewsArticle WHERE url = ?
        
        alt Article exists
            DB-->>Repository: record found
            Repository-->>Importer: skip (already imported)
        else Article new
            DB-->>Repository: not found
            Importer->>Importer: Extract title, summary, date
            Importer->>Importer: Tag with tournament + player names
            Importer->>Repository: create(article)
            Repository->>DB: INSERT INTO NewsArticle
            DB-->>Repository: success
        end
    end
```

