-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Media" (
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

-- CreateTable
CREATE TABLE "Data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "edit" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Slideshow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" INTEGER NOT NULL,
    CONSTRAINT "Slideshow_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Slide" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slideshowId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    CONSTRAINT "Slide_slideshowId_fkey" FOREIGN KEY ("slideshowId") REFERENCES "Slideshow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Slide_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SlideData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slideId" INTEGER NOT NULL,
    "dataId" INTEGER NOT NULL,
    CONSTRAINT "SlideData_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SlideData_dataId_fkey" FOREIGN KEY ("dataId") REFERENCES "Data" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slideshowId" INTEGER NOT NULL,
    "settings" JSONB,
    CONSTRAINT "Mode_slideshowId_fkey" FOREIGN KEY ("slideshowId") REFERENCES "Slideshow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "standby" BOOLEAN NOT NULL,
    "standbyStartTime" DATETIME NOT NULL,
    "standbyEndTime" DATETIME NOT NULL,
    "restartAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "brightness" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SlideData_slideId_dataId_key" ON "SlideData"("slideId", "dataId");
