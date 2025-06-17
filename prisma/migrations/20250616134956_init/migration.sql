/*
  Warnings:

  - You are about to drop the column `slideId` on the `Media` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_SlideMedia" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_SlideMedia_A_fkey" FOREIGN KEY ("A") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SlideMedia_B_fkey" FOREIGN KEY ("B") REFERENCES "Slide" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    CONSTRAINT "Media_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Media" ("fileName", "format", "id", "originalFileName", "path", "size", "thumbnailId", "type", "updatedAt", "uploadedAt") SELECT "fileName", "format", "id", "originalFileName", "path", "size", "thumbnailId", "type", "updatedAt", "uploadedAt" FROM "Media";
DROP TABLE "Media";
ALTER TABLE "new_Media" RENAME TO "Media";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_SlideMedia_AB_unique" ON "_SlideMedia"("A", "B");

-- CreateIndex
CREATE INDEX "_SlideMedia_B_index" ON "_SlideMedia"("B");
