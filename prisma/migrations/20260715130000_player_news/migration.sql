-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "outlet" TEXT,
    "author" TEXT,
    "categories" TEXT,
    "publishedAt" TIMESTAMP(3),
    "playerId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'sportsdataio',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_externalId_key" ON "news_articles"("externalId");

-- CreateIndex
CREATE INDEX "news_articles_playerId_idx" ON "news_articles"("playerId");

-- CreateIndex
CREATE INDEX "news_articles_publishedAt_idx" ON "news_articles"("publishedAt");

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
