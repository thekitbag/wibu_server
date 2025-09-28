-- CreateTable
CREATE TABLE "Stop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "image_url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "journeyId" TEXT NOT NULL,
    CONSTRAINT "Stop_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
