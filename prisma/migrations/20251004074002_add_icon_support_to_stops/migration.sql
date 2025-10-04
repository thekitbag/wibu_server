-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Stop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "image_url" TEXT,
    "icon_name" TEXT,
    "external_url" TEXT,
    "order" INTEGER NOT NULL,
    "journeyId" TEXT NOT NULL,
    CONSTRAINT "Stop_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Stop" ("external_url", "id", "image_url", "journeyId", "note", "order", "title") SELECT "external_url", "id", "image_url", "journeyId", "note", "order", "title" FROM "Stop";
DROP TABLE "Stop";
ALTER TABLE "new_Stop" RENAME TO "Stop";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
