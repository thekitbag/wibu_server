-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Journey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "shareableToken" TEXT
);
INSERT INTO "new_Journey" ("id", "title") SELECT "id", "title" FROM "Journey";
DROP TABLE "Journey";
ALTER TABLE "new_Journey" RENAME TO "Journey";
CREATE UNIQUE INDEX "Journey_shareableToken_key" ON "Journey"("shareableToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
