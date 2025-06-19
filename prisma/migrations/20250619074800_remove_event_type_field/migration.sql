/*
  Warnings:

  - You are about to drop the column `type` on the `SecurityEvent` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SecurityEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "severity" TEXT,
    "withWorkStop" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SecurityEvent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SecurityEvent" ("createdAt", "createdBy", "date", "description", "id", "location", "severity", "updatedAt", "withWorkStop") SELECT "createdAt", "createdBy", "date", "description", "id", "location", "severity", "updatedAt", "withWorkStop" FROM "SecurityEvent";
DROP TABLE "SecurityEvent";
ALTER TABLE "new_SecurityEvent" RENAME TO "SecurityEvent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
