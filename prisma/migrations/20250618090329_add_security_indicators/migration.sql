-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "SecurityIndicators" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lastAccidentDate" DATETIME,
    "lastAccidentWithStopDate" DATETIME,
    "lastAccidentWithoutStopDate" DATETIME,
    "recordStartDate" DATETIME,
    "currentDaysWithoutAccident" INTEGER NOT NULL DEFAULT 0,
    "currentDaysWithoutAccidentWithStop" INTEGER NOT NULL DEFAULT 0,
    "currentDaysWithoutAccidentWithoutStop" INTEGER NOT NULL DEFAULT 0,
    "recordDaysWithoutAccident" INTEGER NOT NULL DEFAULT 0,
    "recordDaysWithoutAccidentDate" DATETIME,
    "yearlyAccidentsCount" INTEGER NOT NULL DEFAULT 0,
    "yearlyAccidentsWithStopCount" INTEGER NOT NULL DEFAULT 0,
    "yearlyAccidentsWithoutStopCount" INTEGER NOT NULL DEFAULT 0,
    "yearlyMinorCareCount" INTEGER NOT NULL DEFAULT 0,
    "yearlyNearMissCount" INTEGER NOT NULL DEFAULT 0,
    "yearlyDangerousSituationCount" INTEGER NOT NULL DEFAULT 0,
    "monthlyAccidentsCount" INTEGER NOT NULL DEFAULT 0,
    "referenceYear" INTEGER NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" INTEGER NOT NULL,
    CONSTRAINT "SecurityIndicators_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
