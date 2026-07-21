# Course-Player Matching Engine — Technical Diagrams

**Status:** Phase 16A Architecture  
**Date:** 2026-07-20  

---

## 1. Data Flow Diagram

```mermaid
graph TD
    A["PGA Tour Statistics"] -->|Daily| B["Player Attribute\nAggregation"]
    C["ShotLink\nBall Tracking"] -->|Daily| B
    D["Player News &\nStatus"] -->|Real-time| B
    
    E["Course Design\nDatabase"] -->|Per event| F["Course Profile\nBuilder"]
    G["Tournament Setup\nSheets"] -->|Tournament week| F
    H["Historical Scoring\nData"] -->|Per tournament| F
    I["Weather Data"] -->|Daily| F
    
    B -->|Player Skill\nProfile| J["Matching Engine\nCore"]
    F -->|Course Demand\nProfile| J
    
    J -->|Version Build\nV{n}| K["Match Score\nRepository"]
    
    K -->|Field Rankings| L["Tournament\nRankings Page"]
    K -->|Player Fit| M["Player Card\nDetail"]
    K -->|Comparative| N["AI Caddie\nExplanations"]
    K -->|Fit+Salary| O["DFS Value\nIntegration"]
    K -->|Fit+Odds| P["Betting\nRecommendations"]
    
    L --> Q["Public API"]
    M --> Q
    N --> Q
    O --> Q
    P --> Q
    
    Q -->|REST/GraphQL| R["CaddieIQ\nUI Components"]
    Q -->|Data Feed| S["Mobile Apps"]
    Q -->|Integration| T["DFS Platforms"]
    Q -->|Integration| U["Betting Apps"]
```

---

## 2. Match Score Calculation Flow

```mermaid
graph LR
    A["Player Profile\n50+ Attributes"] -->|Skill Percentiles| B["Skill Fit\nScore 0-100"]
    C["Course Profile\n60+ Attributes"] -->|Demand Weights| B
    
    B -->|Base Score| D["Apply Form\nBonus ±15"]
    D --> E["Apply Venue\nHistory ±10"]
    E --> F["Score Range\n0-100 or lower"]
    
    G["Player Data\nQuality"] -->|Coverage| H["Confidence\nCalculator 0-100"]
    I["Course Data\nQuality"] -->|Coverage| H
    J["Data Alignment"] -->|Freshness| H
    
    H -->|Multiplier 0.3-1.0| K["Confidence\nAdjustment"]
    F --> K
    
    K -->|Final Score| L["Composite\nMatch Score"]
    
    M["Player Volatility"] -->|Std Dev| N["Ceiling/Floor\nCalculation"]
    C -->|Course Volatility| N
    
    N -->|+1σ/-1σ| O["Upside/Downside\nRange"]
    L -->|Base| O
    
    O -->|All Components| P["Explainability\nEngine"]
    
    P -->|5-Part| Q["Natural Language\nExplanation"]
    L --> Q
    H --> Q
```

---

## 3. Confidence Calculation Hierarchy

```mermaid
graph TD
    A["Player Coverage\nConfidence"] -->|50%| B["Composite\nConfidence"]
    C["Player Signal\nReliability"] -->|35%| B
    D["Data Alignment\nConfidence"] -->|15%| B
    
    subgraph A_Details ["Player Coverage"]
        A1["Tournament\nRounds 50%"]
        A2["Attribute\nCompleteness 30%"]
        A3["Data Recency 20%"]
        A1 -->|Average| A
        A2 --> A
        A3 --> A
    end
    
    subgraph C_Details ["Signal Reliability"]
        C1["Measurement\nStability 50%"]
        C2["Sample Size\nAdequacy 35%"]
        C3["Health Status 15%"]
        C1 -->|Average| C
        C2 --> C
        C3 --> C
    end
    
    subgraph D_Details ["Data Alignment"]
        D1["Temporal\nAlignment 40%"]
        D2["Format\nAlignment 40%"]
        D3["Tier\nAlignment 20%"]
        D1 -->|Average| D
        D2 --> D
        D3 --> D
    end
    
    B -->|0-95%| E["Final Confidence\nScore"]
    
    E -->|80-95%| F["High\nConfidence"]
    E -->|65-79%| G["Medium-High\nConfidence"]
    E -->|50-64%| H["Medium\nConfidence"]
    E -->|<50%| I["Low\nConfidence"]
    
    F -->|Display| J["Exact Score\n72"]
    G --> K["Score + Range\n72±4"]
    H --> K
    I --> L["Categorical\nEstimate"]
```

---

## 4. Versioning & Build Lifecycle

```mermaid
graph LR
    A["Build\nDEVELOPMENT"] -->|Ready for Testing| B["Build\nCANDIDATE"]
    
    B -->|Side-by-side\nComparison| C["Validation\nWeek"]
    
    C -->|Pass| D["Build\nACTIVE"]
    C -->|Fail| E["Build\nRETIRED"]
    
    D -->|New Scores| F["Match Score\nRepository\nV{n}"]
    E -->|Historical| G["Archive\nV{n-1}"]
    
    F -->|Tournament Results| H["Accuracy\nMetrics"]
    
    H -->|Improvement| I["Next Build\nV{n+1}"]
    H -->|Regression| J["Rollback\nto V{n-1}"]
    
    I -->|DEVELOPMENT| A
    J -->|ACTIVE| D
    
    F -->|Historical\nComparison| K["A/B Analysis\n(V{n} vs V{n-1})"]
```

---

## 5. Player Skill Fit Scoring

```mermaid
graph TD
    A["Player Attributes"] -->|Driving| B1["95th percentile\nDriving Distance"]
    A -->|Approach| B2["75th percentile\nApproach Precision"]
    A -->|Short Game| B3["70th percentile\nScrambling"]
    A -->|Putting| B4["60th percentile\nElite Putting"]
    A -->|Scoring| B5["72nd percentile\nScoring Avg"]
    
    C["Course Profile"] -->|Demand| D1["40%\nDriving Demand"]
    C -->|Demand| D2["25%\nApproach Demand"]
    C -->|Demand| D3["15%\nShort Game"]
    C -->|Demand| D4["10%\nPutting Demand"]
    C -->|Demand| D5["10%\nScoring Context"]
    
    B1 -->|Weighted| E["(95 × 0.40)"]
    B2 -->|Weighted| F["(75 × 0.25)"]
    B3 -->|Weighted| G["(70 × 0.15)"]
    B4 -->|Weighted| H["(60 × 0.10)"]
    B5 -->|Weighted| I["(72 × 0.10)"]
    
    E -->|Sum &| J["Skill Fit Score\n= 80.7 / 100"]
    F --> J
    G --> J
    H --> J
    I --> J
    
    D1 --> E
    D2 --> F
    D3 --> G
    D4 --> H
    D5 --> I
```

---

## 6. Complete Match Score Components

```mermaid
graph TD
    A["Skill Fit"] -->|0-100| B["Match Score\nComponents"]
    C["Form Bonus"] -->|±15| B
    D["Venue History"] -->|±10| B
    
    B -->|Normalize| E["Combined\nScore"]
    E -->|Clamp 0-100| F["Raw Score\n0-100"]
    
    G["Player Data\nQuality"] -->|0.3-1.0| H["Confidence\nMultiplier"]
    I["Course Data\nQuality"] -->|0.3-1.0| H
    J["Alignment\nQuality"] -->|0.3-1.0| H
    
    F -->|×| K["Confidence\nAdjusted"]
    H -->|×| K
    
    L["Player\nVolatility"] -->|σ| M["Ceiling\n+1σ"]
    N["Course\nVolatility"] -->|σ| M
    
    M -->|Upside| O["Volatility\nProfile"]
    F -->|Base| O
    
    P["Downside\n-1σ"] -->|Risk| O
    
    K -->|Final| Q["Display Score\n0-100"]
    O -->|Range| Q
    H -->|Confidence| Q
```

---

## 7. Data Pipeline Architecture

```mermaid
graph TD
    subgraph Source ["SOURCE SYSTEMS"]
        S1["PGA Tour\nStats API"]
        S2["ShotLink\nBall Tracking"]
        S3["Course Design\nDatabase"]
        S4["Tournament\nSetup Sheets"]
        S5["Weather Data"]
    end
    
    subgraph Ingest ["DATA INGESTION"]
        I1["Import\nScheduler"]
        I2["Validation\nPipeline"]
        I3["Normalization\nEngine"]
        I4["Quality\nChecks"]
    end
    
    subgraph Intel ["INTELLIGENCE LAYERS"]
        IL1["Player Intelligence\nService"]
        IL2["Course Intelligence\nService"]
        IL3["Tournament Context\nService"]
    end
    
    subgraph Core ["MATCHING ENGINE"]
        C1["Skill Fit\nCalculator"]
        C2["Form Adjuster"]
        C3["Venue Bonus\nCalculator"]
        C4["Confidence\nEngine"]
        C5["Explainability\nEngine"]
    end
    
    subgraph Storage ["PERSISTENCE"]
        DB1["Match Scores\nRepository"]
        DB2["Build Versions\nRegistry"]
        DB3["Historical\nArchive"]
    end
    
    subgraph Output ["PUBLIC API"]
        A1["REST Endpoints"]
        A2["GraphQL Schema"]
        A3["Event Streams"]
    end
    
    S1 --> I1
    S2 --> I1
    S3 --> I1
    S4 --> I1
    S5 --> I1
    
    I1 --> I2 --> I3 --> I4
    
    I4 -->|Player Data| IL1
    I4 -->|Course Data| IL2
    I4 -->|Tournament Context| IL3
    
    IL1 --> C1
    IL2 --> C1
    IL3 --> C1
    
    C1 --> C2 --> C3 --> C4 --> C5
    
    C5 --> DB1
    C5 --> DB2
    DB1 --> DB3
    
    DB1 --> A1
    DB1 --> A2
    DB1 --> A3
    
    A1 -->|HTTP| Output
    A2 -->|GraphQL| Output
    A3 -->|WebSocket| Output
```

---

## 8. Course Demand Weight Evolution

```mermaid
graph TD
    A["Course\nCharacteristics"] -->|Analyze| B["Identify\nDemand Drivers"]
    
    B -->|Long Yardage| C["High Driving\nDemand"]
    B -->|Narrow Fairways| C
    B -->|Par 4 Heavy| C
    
    B -->|Small Greens| D["High Approach\nDemand"]
    B -->|Firm Surface| D
    B -->|Elevation| D
    
    B -->|Rough Coverage| E["High Short Game\nDemand"]
    B -->|Bunker Density| E
    B -->|Water Hazards| E
    
    B -->|Fast Greens| F["High Putting\nDemand"]
    B -->|Steep Slopes| F
    B -->|Multi-Tiered| F
    
    B -->|Difficulty Tier| G["Scoring\nContext Weight"]
    
    C -->|Set Weight| H["Weights\n0-100%"]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H -->|Sum to 100| I["Final Weight\nDistribution"]
    
    I -->|Example:| J["Long Course:\nDriving 40%,\nApproach 25%,\nShort 15%,\nPutting 10%,\nScoring 10%"]
```

---

## 9. Explainability Pipeline

```mermaid
graph LR
    A["Match Score\nComponents"] -->|Lead| B["1-Sentence\nExplanation"]
    
    A -->|Per Skill| C["Driving\nExplanation"]
    A -->|Per Skill| D["Approach\nExplanation"]
    A -->|Per Skill| E["Short Game\nExplanation"]
    A -->|Per Skill| F["Putting\nExplanation"]
    A -->|Per Skill| G["Scoring\nExplanation"]
    
    A -->|Form| H["Form &\nMomentum"]
    A -->|History| I["Venue History"]
    A -->|Volatility| J["Risk Profile"]
    
    B --> K["Composite\nNarrative"]
    C --> K
    D --> K
    E --> K
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
    
    K -->|Plain| L["English\nExplanation"]
    
    L -->|Store| M["Explanation\nRepository"]
    
    M -->|Display| N["Player Card\nUI"]
    M -->|Display| O["Tournament\nRankings"]
    M -->|Feed| P["AI Caddie\nResponses"]
```

---

## 10. ML Extension Architecture

```mermaid
graph TD
    A["Phase 16A\nHand-Tuned Weights"] -->|Baseline| B["Build V1.0\nACTIVE"]
    
    C["Historical\nTournament Data"] -->|2+ Years| D["ML Training\nDataset"]
    
    D -->|Labels:| E["Finish Position,\nScoring Avg,\nUpside/Downside"]
    
    E -->|Train| F["Phase 16B\nGradient Boosting\nModel XGBoost"]
    
    F -->|Output| G["Optimized\nWeights"]
    
    G -->|Create| H["Build V2.0\nCANDIDATE"]
    
    B -->|A/B Test| H
    
    H -->|Validation| I{"Improve\nAccuracy?"}
    
    I -->|Yes| J["Promote to\nACTIVE"]
    I -->|No| K["Analyze &\nDebug"]
    
    K -->|Iterate| F
    
    J -->|Production| L["V2.0 Scores"]
    B -->|Archive| M["V1.0 Scores\nHistorical"]
    
    L -->|Insights| N["Phase 16C\nDeep Learning\nTransformer"]
    
    N -->|Real-time| O["Phase 17\nRL Simulation\nShot-by-shot"]
```

---

## 11. Data Storage Architecture

```mermaid
graph TD
    subgraph Tables ["DATABASE TABLES"]
        T1["MatchScore\n(versioned, indexed)"]
        T2["PlayerSkillProfile\n(cached hourly)"]
        T3["CourseProfile\n(cached weekly)"]
        T4["BuildConfiguration\n(versioned)"]
        T5["MatchScoreBuild\n(version history)"]
        T6["TournamentContext\n(current event)"]
    end
    
    subgraph Caches ["CACHE LAYERS"]
        C1["Match Score\nIn-Memory Cache\n(TTL: 1 week)"]
        C2["Skill Profile\nRedis Cache\n(TTL: 24h)"]
        C3["Course Profile\nRedis Cache\n(TTL: 1 week)"]
    end
    
    subgraph Queries ["PRIMARY QUERIES"]
        Q1["Get match scores\nfor tournament"]
        Q2["Get player fit\nat course"]
        Q3["Compare v1 vs v2"]
        Q4["Historical archival"]
    end
    
    T1 -->|Partition| C1
    T2 -->|Replicate| C2
    T3 -->|Replicate| C3
    
    Q1 --> C1
    Q2 --> C1
    Q3 --> T5
    Q4 --> T1
    
    C1 -->|Invalidate| T1
    C2 -->|Refresh| T2
    C3 -->|Refresh| T3
    
    T4 -->|Reference| T1
```

---

## 12. System Context Diagram

```mermaid
graph TB
    subgraph External ["EXTERNAL SYSTEMS"]
        EX1["PGA Tour\nPublic API"]
        EX2["DFS Platforms\n(DraftKings,\nFanDuel)"]
        EX3["Betting Apps\n(DraftBet,\nPointsBet)"]
        EX4["Weather Services"]
    end
    
    subgraph CaddieIQ ["CADDIEIQ PLATFORM"]
        Core["Matching Engine\n(Phase 16A+)"]
        API["Public REST/\nGraphQL API"]
        UI["UI Components\n(Player Cards,\nRankings)"]
        AICAd["AI Caddie\nService"]
    end
    
    subgraph Users ["END USERS"]
        DFSUser["DFS Player\n(Salary Analysis)"]
        BetUser["Bettor\n(Odds Finder)"]
        AppUser["App User\n(Rankings, Cards)"]
        TourOps["Tournament\nOperations"]
    end
    
    EX1 -->|Data| Core
    EX4 -->|Data| Core
    
    Core -->|Scores| API
    API -->|Data| UI
    API -->|Data| AICAd
    
    UI -->|Display| AppUser
    UI -->|Rankings| TourOps
    
    API -->|Fit + Salary| EX2
    EX2 -->|Help| DFSUser
    
    API -->|Fit + Odds| EX3
    EX3 -->|Help| BetUser
    
    AICAd -->|Explanations| AppUser
```

---

**Diagram Summary:**

These 12 diagrams provide:
- **Data Flow:** From sources through intelligence to outputs
- **Calculation:** How match scores are computed
- **Confidence:** How uncertainty is quantified
- **Versioning:** How builds evolve
- **Skill Scoring:** How player-course fit is measured
- **Components:** All pieces of the final score
- **Pipeline:** Complete end-to-end flow
- **Weights:** How course demands drive weighting
- **Explainability:** How narratives are generated
- **ML:** How future AI extends the system
- **Storage:** How data is persisted and cached
- **Context:** How systems interact

All diagrams are Mermaid-renderable and can be converted to images or embedded in documentation.
