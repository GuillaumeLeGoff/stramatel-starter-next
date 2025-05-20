/*
  Warnings:

  - You are about to drop the column `height` on the `Slide` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `Slide` table. All the data in the column will be lost.
  - You are about to drop the column `konvaState` on the `Slideshow` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "standby" BOOLEAN NOT NULL,
    "standbyStartTime" DATETIME NOT NULL,
    "standbyEndTime" DATETIME NOT NULL,
    "restartAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "brightness" INTEGER NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 1920,
    "height" INTEGER NOT NULL DEFAULT 1080
);
INSERT INTO "new_AppSettings" ("brightness", "id", "restartAt", "standby", "standbyEndTime", "standbyStartTime", "updatedAt") SELECT "brightness", "id", "restartAt", "standby", "standbyEndTime", "standbyStartTime", "updatedAt" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE TABLE "new_Slide" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slideshowId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "konvaData" JSONB,
    "mediaId" INTEGER,
    CONSTRAINT "Slide_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Slide_slideshowId_fkey" FOREIGN KEY ("slideshowId") REFERENCES "Slideshow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Slide" ("duration", "id", "konvaData", "mediaId", "position", "slideshowId") SELECT "duration", "id", "konvaData", "mediaId", "position", "slideshowId" FROM "Slide";
DROP TABLE "Slide";
ALTER TABLE "new_Slide" RENAME TO "Slide";
CREATE TABLE "new_Slideshow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" INTEGER NOT NULL,
    CONSTRAINT "Slideshow_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Slideshow" ("createdBy", "description", "id", "name") SELECT "createdBy", "description", "id", "name" FROM "Slideshow";
DROP TABLE "Slideshow";
ALTER TABLE "new_Slideshow" RENAME TO "Slideshow";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
