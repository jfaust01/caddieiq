SELECT 
  tablename,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name = t.tablename) as exists
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('rounds', 'player_rounds', 'player_season_statistics')
ORDER BY tablename;
