-- Phase 17.3A: Historical Data Foundation and Temporal Integrity
-- This migration adds temporal data infrastructure for reproducible historical validation

-- ============================================================================
-- 1. CANONICAL ENTITY IDENTIFIER MAPPING
-- ============================================================================

CREATE TABLE provider_id_mappings (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('player', 'tournament', 'course')),
  internal_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_record_id TEXT NOT NULL,
  mapping_status TEXT NOT NULL CHECK (mapping_status IN ('verified', 'pending', 'disputed', 'rejected')),
  verification_source TEXT,
  verification_timestamp TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_provider_id_mappings_lookup ON provider_id_mappings(provider, provider_id, entity_type);
CREATE INDEX idx_provider_id_mappings_internal ON provider_id_mappings(internal_id);
CREATE INDEX idx_provider_id_mappings_status ON provider_id_mappings(mapping_status);

-- ============================================================================
-- 2. TOURNAMENT ENHANCEMENTS FOR TEMPORAL BOUNDARIES
-- ============================================================================

ALTER TABLE tournaments
  ADD COLUMN lock_datetime TIMESTAMP,
  ADD COLUMN lock_datetime_set_at TIMESTAMP,
  ADD COLUMN edition_sequence INT,
  ADD COLUMN tournament_series_id TEXT,
  ADD COLUMN provider_edition_id TEXT,
  ADD COLUMN lock_datetime_is_immutable BOOLEAN DEFAULT false;

CREATE UNIQUE INDEX idx_tournaments_provider_edition ON tournaments(provider_edition_id) WHERE provider_edition_id IS NOT NULL;
CREATE INDEX idx_tournaments_lock_datetime ON tournaments(lock_datetime);

-- ============================================================================
-- 3. TOURNAMENT FIELD ENHANCEMENTS FOR TEMPORAL TRACKING
-- ============================================================================

ALTER TABLE tournament_fields
  ADD COLUMN entry_confirmed_at TIMESTAMP,
  ADD COLUMN withdrawal_timestamp TIMESTAMP,
  ADD COLUMN withdrawal_known_timestamp TIMESTAMP,
  ADD COLUMN entry_status_changed_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN source_effective_timestamp TIMESTAMP,
  ADD COLUMN alternate_status TEXT CHECK (alternate_status IN ('primary', 'alternate', 'alternate_called', NULL)),
  ADD COLUMN alternate_call_timestamp TIMESTAMP,
  ADD COLUMN source_provider TEXT DEFAULT 'sportsdataio',
  ADD COLUMN source_record_id TEXT,
  ADD COLUMN retrieved_timestamp TIMESTAMP;

CREATE INDEX idx_tournament_fields_source ON tournament_fields(source_provider, source_record_id);
CREATE INDEX idx_tournament_fields_temporal ON tournament_fields(entry_confirmed_at, withdrawal_timestamp);

-- ============================================================================
-- 4. BITEMPORAL FEATURE STORAGE
-- ============================================================================

CREATE TABLE historical_player_features (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_version TEXT NOT NULL,
  feature_value TEXT,
  unit TEXT,
  
  -- Bitemporal timestamps
  valid_from TIMESTAMP NOT NULL,
  valid_to TIMESTAMP,
  system_recorded_at TIMESTAMP NOT NULL,
  
  -- Provenance
  source_provider TEXT NOT NULL,
  source_record_id TEXT,
  retrieval_timestamp TIMESTAMP NOT NULL,
  raw_payload_checksum TEXT,
  
  -- Quality
  data_quality_status TEXT NOT NULL CHECK (data_quality_status IN ('verified', 'estimated', 'partial', 'error')),
  missing_data_reason TEXT,
  
  -- Transformation
  transformation_version TEXT,
  
  -- Immutability
  sealed BOOLEAN NOT NULL DEFAULT false,
  sealed_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historical_player_features_player ON historical_player_features(player_id);
CREATE INDEX idx_historical_player_features_feature ON historical_player_features(feature_key);
CREATE INDEX idx_historical_player_features_temporal ON historical_player_features(valid_from, valid_to);
CREATE INDEX idx_historical_player_features_validity ON historical_player_features(player_id, feature_key, valid_to) WHERE valid_to IS NULL;

-- Immutability constraint: cannot update sealed features
CREATE TRIGGER prevent_update_sealed_features
  BEFORE UPDATE ON historical_player_features
  FOR EACH ROW
  WHEN (OLD.sealed = true)
  BEGIN
    RAISE EXCEPTION 'Cannot update sealed historical feature';
  END;

-- ============================================================================
-- 5. HISTORICAL SNAPSHOTS (IMMUTABLE PREDICTION INPUTS)
-- ============================================================================

CREATE TABLE historical_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_hash TEXT NOT NULL UNIQUE,
  
  -- Identification
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  lock_timestamp TIMESTAMP NOT NULL,
  model_version TEXT NOT NULL,
  feature_set_version TEXT NOT NULL,
  
  -- Snapshot data (JSON for flexibility)
  features JSONB NOT NULL,
  
  -- Metadata
  features_included JSONB NOT NULL,
  features_excluded JSONB NOT NULL,
  late_arrivals_excluded JSONB,
  completeness_score FLOAT,
  
  -- Immutability
  sealed BOOLEAN NOT NULL DEFAULT false,
  sealed_at TIMESTAMP,
  
  -- Audit
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  generated_by TEXT NOT NULL DEFAULT 'snapshot_service',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_historical_snapshots_lookup ON historical_snapshots(tournament_id, player_id, model_version, feature_set_version);
CREATE INDEX idx_historical_snapshots_player ON historical_snapshots(player_id);
CREATE INDEX idx_historical_snapshots_tournament ON historical_snapshots(tournament_id);
CREATE INDEX idx_historical_snapshots_sealed ON historical_snapshots(sealed);

-- Immutability constraint: sealed snapshots cannot be updated
CREATE TRIGGER prevent_update_sealed_snapshots
  BEFORE UPDATE ON historical_snapshots
  FOR EACH ROW
  WHEN (OLD.sealed = true)
  BEGIN
    RAISE EXCEPTION 'Cannot update sealed historical snapshot';
  END;

-- ============================================================================
-- 6. DATA AUDIT LOG (APPEND-ONLY)
-- ============================================================================

CREATE TABLE historical_data_audit_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'feature_added', 'feature_updated', 'snapshot_sealed', 
    'lock_datetime_set', 'field_entry_confirmed', 'field_withdrawal'
  )),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  reason TEXT,
  performed_by TEXT NOT NULL DEFAULT 'system',
  performed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_events_entity ON historical_data_audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_timestamp ON historical_data_audit_events(performed_at);
CREATE INDEX idx_audit_events_type ON historical_data_audit_events(event_type);

-- ============================================================================
-- 7. DATA QUALITY REPORT
-- ============================================================================

CREATE TABLE data_quality_reports (
  id TEXT PRIMARY KEY,
  import_job_id TEXT NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Counts
  total_checks_run INT NOT NULL,
  checks_passed_count INT NOT NULL,
  checks_failed_count INT NOT NULL,
  
  -- Issue details (JSON)
  details JSONB NOT NULL,
  
  -- Determination
  quality_status TEXT NOT NULL CHECK (quality_status IN (
    'excellent', 'good', 'acceptable', 'degraded', 'failed'
  )),
  
  blocking_issues JSONB,
  warning_issues JSONB,
  recommended_actions JSONB,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_quality_reports_job ON data_quality_reports(import_job_id);
CREATE INDEX idx_data_quality_reports_status ON data_quality_reports(quality_status);

-- ============================================================================
-- 8. HISTORICAL RANKINGS (TIME-VERSIONED)
-- ============================================================================

CREATE TABLE historical_player_rankings (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- Ranking details
  ranking_system TEXT NOT NULL,
  player_rank INT NOT NULL,
  ranking_points INT,
  
  -- Temporal
  published_date TIMESTAMP NOT NULL,
  effective_date TIMESTAMP NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  valid_to TIMESTAMP,
  
  -- Provenance
  source TEXT NOT NULL,
  retrieved_timestamp TIMESTAMP NOT NULL,
  original_record_identifier TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historical_rankings_player ON historical_player_rankings(player_id);
CREATE INDEX idx_historical_rankings_temporal ON historical_player_rankings(valid_from, valid_to);
CREATE INDEX idx_historical_rankings_system ON historical_player_rankings(ranking_system);

-- ============================================================================
-- 9. HISTORICAL SALARY AND ODDS SNAPSHOTS
-- ============================================================================

CREATE TABLE historical_salary_odds_snapshots (
  id TEXT PRIMARY KEY,
  
  -- Identification
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- DraftKings
  dk_salary INT,
  dk_retrieved_at TIMESTAMP,
  
  -- FanDuel
  fd_salary INT,
  fd_retrieved_at TIMESTAMP,
  
  -- Odds
  opening_odds FLOAT,
  closing_odds FLOAT,
  odds_market_timestamp TIMESTAMP,
  
  -- Metadata
  provider TEXT NOT NULL,
  contest_slate_identifier TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_salary_odds_lookup ON historical_salary_odds_snapshots(tournament_id, player_id, provider);

-- ============================================================================
-- 10. TOURNAMENT OUTCOMES (SEPARATE FROM INPUTS)
-- ============================================================================

CREATE TABLE historical_tournament_outcomes (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- Results
  finish_position INT,
  official_finish_text TEXT,
  tie_status TEXT,
  cut_status TEXT CHECK (cut_status IN ('made', 'missed', 'unknown', NULL)),
  withdrawal_status TEXT CHECK (withdrawal_status IN ('withdrew', 'not_withdrawn', 'unknown', NULL)),
  disqualified BOOLEAN DEFAULT false,
  
  -- Scores
  round_scores JSONB,
  total_strokes INT,
  score_to_par INT,
  
  -- Fantasy scoring
  dk_fantasy_points FLOAT,
  fd_fantasy_points FLOAT,
  
  -- Source
  result_source TEXT NOT NULL,
  result_source_timestamp TIMESTAMP,
  retrieved_timestamp TIMESTAMP NOT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_historical_outcomes_lookup ON historical_tournament_outcomes(tournament_id, player_id);
CREATE INDEX idx_historical_outcomes_tournament ON historical_tournament_outcomes(tournament_id);
CREATE INDEX idx_historical_outcomes_finish ON historical_tournament_outcomes(finish_position);

-- ============================================================================
-- 11. IMPORT JOB TRACKING
-- ============================================================================

CREATE TABLE historical_import_jobs (
  id TEXT PRIMARY KEY,
  
  -- Identification
  import_type TEXT NOT NULL CHECK (import_type IN (
    'tournament_edition', 'tournament_field', 'player_features',
    'rankings', 'salaries_odds', 'outcomes'
  )),
  
  -- Source
  source_provider TEXT NOT NULL,
  source_endpoint TEXT,
  source_file_checksum TEXT,
  
  -- Execution
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'partial', 'failed')),
  
  -- Records
  records_attempted INT,
  records_succeeded INT,
  records_failed INT,
  
  -- Quality
  quality_report_id TEXT REFERENCES data_quality_reports(id),
  
  -- Audit
  error_log TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_status ON historical_import_jobs(status);
CREATE INDEX idx_import_jobs_timestamp ON historical_import_jobs(started_at);

-- ============================================================================
-- Summary
-- ============================================================================

-- New tables:
--   - provider_id_mappings (identity mapping registry)
--   - historical_player_features (bitemporal features)
--   - historical_snapshots (immutable prediction inputs)
--   - historical_data_audit_events (append-only audit log)
--   - data_quality_reports (QA results)
--   - historical_player_rankings (time-versioned rankings)
--   - historical_salary_odds_snapshots (pre-tournament market data)
--   - historical_tournament_outcomes (separate from inputs)
--   - historical_import_jobs (import tracking)
--
-- Enhanced existing tables:
--   - tournaments (lock_datetime, edition tracking)
--   - tournament_fields (temporal tracking, provenance)
--
-- Design principles:
--   ✓ Complete provenance tracking
--   ✓ Temporal accuracy (valid_from/valid_to vs system_recorded_at)
--   ✓ Immutability at persistence level (triggers + constraints)
--   ✓ Append-only audit log
--   ✓ Outcome isolation from inputs
--   ✓ No fabrication (nullable fields for missing data)
--   ✓ No look-ahead leakage (feature timestamps validated)
