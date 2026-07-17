-- Check if any rounds exist in the database
SELECT 
  t.id as tournament_id,
  t.name as tournament_name,
  COUNT(r.id) as round_count,
  COUNT(DISTINCT pr.id) as player_round_count
FROM tournaments t
LEFT JOIN rounds r ON t.id = r."tournamentId"
LEFT JOIN player_rounds pr ON r.id = pr."roundId"
WHERE t.status = 'COMPLETED'
GROUP BY t.id, t.name
HAVING COUNT(r.id) > 0
ORDER BY t.name
LIMIT 5;
