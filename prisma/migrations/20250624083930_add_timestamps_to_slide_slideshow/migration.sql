/*
  Warnings:

  - Added the required column `updatedAt` to the `Slide` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Slideshow` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Slide" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slideshowId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "konvaData" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Slide_slideshowId_fkey" FOREIGN KEY ("slideshowId") REFERENCES "Slideshow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Slide" ("duration", "id", "konvaData", "position", "slideshowId", "createdAt", "updatedAt") SELECT "duration", "id", "konvaData", "position", "slideshowId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Slide";
DROP TABLE "Slide";
ALTER TABLE "new_Slide" RENAME TO "Slide";
CREATE TABLE "new_Slideshow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Slideshow_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Slideshow" ("createdBy", "description", "id", "name", "createdAt", "updatedAt") SELECT "createdBy", "description", "id", "name", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Slideshow";
DROP TABLE "Slideshow";
ALTER TABLE "new_Slideshow" RENAME TO "Slideshow";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
