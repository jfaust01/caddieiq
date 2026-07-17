-- AddColumn externalId to Tournament model
-- SportsDataIO tournament ID for leaderboard/results fetching
ALTER TABLE "tournaments" ADD COLUMN "externalId" TEXT;
