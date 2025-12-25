-- CreateTable
CREATE TABLE "AISettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'seo',
    "imageStyle" TEXT NOT NULL DEFAULT 'studio',
    "imageCount" INTEGER NOT NULL DEFAULT 3,
    "pricingStrategy" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductGeneration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "AISettings_shop_key" ON "AISettings"("shop");
