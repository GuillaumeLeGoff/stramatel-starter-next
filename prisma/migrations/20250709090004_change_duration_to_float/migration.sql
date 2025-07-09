/*
  Warnings:

  - You are about to alter the column `duration` on the `Slide` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Slide" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slideshowId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "duration" REAL NOT NULL DEFAULT 5.0,
    "konvaData" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Slide_slideshowId_fkey" FOREIGN KEY ("slideshowId") REFERENCES "Slideshow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Slide" ("createdAt", "duration", "id", "konvaData", "position", "slideshowId", "updatedAt") SELECT "createdAt", "duration", "id", "konvaData", "position", "slideshowId", "updatedAt" FROM "Slide";
DROP TABLE "Slide";
ALTER TABLE "new_Slide" RENAME TO "Slide";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
