/*
  Warnings:

  - You are about to drop the column `mediaId` on the `Slide` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalFileName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "thumbnailId" INTEGER,
    "slideId" INTEGER,
    CONSTRAINT "Media_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Media_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Media" ("fileName", "format", "id", "originalFileName", "path", "size", "thumbnailId", "type", "updatedAt", "uploadedAt") SELECT "fileName", "format", "id", "originalFileName", "path", "size", "thumbnailId", "type", "updatedAt", "uploadedAt" FROM "Media";
DROP TABLE "Media";
ALTER TABLE "new_Media" RENAME TO "Media";
CREATE TABLE "new_Slide" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slideshowId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "konvaData" JSONB,
    CONSTRAINT "Slide_slideshowId_fkey" FOREIGN KEY ("slideshowId") REFERENCES "Slideshow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Slide" ("duration", "id", "konvaData", "position", "slideshowId") SELECT "duration", "id", "konvaData", "position", "slideshowId" FROM "Slide";
DROP TABLE "Slide";
ALTER TABLE "new_Slide" RENAME TO "Slide";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
