-- AddColumn to players table
ALTER TABLE "players" ADD COLUMN "activePlayerIntelligenceBuildId" TEXT;

-- AddUniqueConstraint
ALTER TABLE "players" ADD CONSTRAINT "players_activePlayerIntelligenceBuildId_key" UNIQUE ("activePlayerIntelligenceBuildId");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_activePlayerIntelligenceBuildId_fkey" FOREIGN KEY ("activePlayerIntelligenceBuildId") REFERENCES "player_intelligence_builds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
