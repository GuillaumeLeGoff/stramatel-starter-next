/*
  Warnings:

  - You are about to drop the column `standby` on the `AppSettings` table. All the data in the column will be lost.
  - You are about to drop the column `standbyEndTime` on the `AppSettings` table. All the data in the column will be lost.
  - You are about to drop the column `standbyStartTime` on the `AppSettings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "restartAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "brightness" INTEGER NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 1920,
    "height" INTEGER NOT NULL DEFAULT 1080
);
INSERT INTO "new_AppSettings" ("brightness", "height", "id", "restartAt", "updatedAt", "width") SELECT "brightness", "height", "id", "restartAt", "updatedAt", "width" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
