# Player Intelligence Test Plan

## Test Scenarios

### 1. Tournament Stats Calculators
- **Happy Path:** Player with multiple completed tournaments
  - Test average finish calculates correctly
  - Test cut percentage is accurate
  - Test top 10 percentage is accurate

- **Edge Cases:**
  - Player with no tournament history
  - Player with all missed cuts
  - Player with one tournament
  - Mixed results (some cuts made, some missed)

### 2. Fantasy Metrics Calculators
- **Happy Path:** Player with multiple fantasy projections and salaries
  - Test average DK points calculated correctly
  - Test average salary calculated correctly
  - Test salary value (points/salary) calculated correctly

- **Edge Cases:**
  - Player with no fantasy projections
  - Player with no salary data
  - Mixed data availability

### 3. Player Intelligence Builder
- **Happy Path:** Build intelligence for a player with data
  - Verify all features calculated
  - Verify data completeness calculated
  - Verify features persisted to database

- **Edge Cases:**
  - Build for player with minimal data
  - Build for player with no tournament history
  - Rebuild (should upsert correctly)

### 4. Repository Operations
- **Query Operations:**
  - Find player intelligence by ID
  - Get specific feature by name
  - Get features by category
  - Retrieve all features for a player

- **Persistence:**
  - Upsert creates new record
  - Upsert updates existing record
  - Features updated with correct values

## Test Data Sets

### Fixture 1: Active PGA Tour Pro
- Multiple seasons of tournament history
- High cut percentage (>80%)
- Top 10 finishes
- Consistent fantasy projections
- Regular DFS salary entries

### Fixture 2: Emerging Player
- Limited tournament history (10-15 events)
- Mixed cut results
- Few top 10 finishes
- Limited fantasy data

### Fixture 3: Part-Time Player
- Sporadic tournament participation
- High variance in results
- Limited fantasy projections
- Inconsistent salary data

### Fixture 4: Minimal Data Player
- Very few tournaments
- No fantasy projections
- No salary data
- Tests graceful degradation
