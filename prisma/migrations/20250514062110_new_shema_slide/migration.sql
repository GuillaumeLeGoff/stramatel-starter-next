/*
  Warnings:

  - You are about to drop the `Data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SlideData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `x` on the `Slide` table. All the data in the column will be lost.
  - You are about to drop the column `y` on the `Slide` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "SlideData_slideId_dataId_key";

-- AlterTable
ALTER TABLE "Slideshow" ADD COLUMN "konvaState" JSONB;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Data";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SlideData";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slideshowId" INTEGER NOT NULL,
    "settings" JSONB,
    CONSTRAINT "Mode_slideshowId_fkey" FOREIGN KEY ("slideshowId") REFERENCES "Slideshow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Mode" ("id", "name", "settings", "slideshowId") SELECT "id", "name", "settings", "slideshowId" FROM "Mode";
DROP TABLE "Mode";
ALTER TABLE "new_Mode" RENAME TO "Mode";
CREATE TABLE "new_Slide" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slideshowId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "width" INTEGER NOT NULL DEFAULT 1920,
    "height" INTEGER NOT NULL DEFAULT 1080,
    "konvaData" JSONB,
    "mediaId" INTEGER,
    CONSTRAINT "Slide_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Slide_slideshowId_fkey" FOREIGN KEY ("slideshowId") REFERENCES "Slideshow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Slide" ("duration", "height", "id", "mediaId", "position", "slideshowId", "width") SELECT "duration", "height", "id", "mediaId", "position", "slideshowId", "width" FROM "Slide";
DROP TABLE "Slide";
ALTER TABLE "new_Slide" RENAME TO "Slide";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
