-- Add an APPROXIMATE tier to CoordinateConfidence, sitting between VERIFIED and
-- ESTIMATED in precision. It records a city/locality centroid (from OpenWeather's
-- Geocoding API) used as a fallback when no course-precise (OSM) match exists.
-- Weather Intelligence trusts VERIFIED + APPROXIMATE; Maps trust only VERIFIED.
--
-- Postgres requires ADD VALUE to run outside a transaction and to be committed
-- before the new label can be used. Prisma runs each migration statement
-- separately, and this migration only adds the label (no data write uses it),
-- so this is safe.
ALTER TYPE "CoordinateConfidence" ADD VALUE IF NOT EXISTS 'APPROXIMATE' AFTER 'VERIFIED';
