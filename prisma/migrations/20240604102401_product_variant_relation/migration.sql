/*
  Warnings:

  - You are about to drop the column `variantId` on the `Product` table. All the data in the column will be lost.
  - Added the required column `productId` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `Variant` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Variant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "qnt" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Variant" ("id", "name", "qnt") SELECT "id", "name", "qnt" FROM "Variant";
DROP TABLE "Variant";
ALTER TABLE "new_Variant" RENAME TO "Variant";
CREATE UNIQUE INDEX "Variant_variantId_key" ON "Variant"("variantId");
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEmailSent" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Product" ("createdAt", "id", "isEmailSent", "name", "productId", "shop") SELECT "createdAt", "id", "isEmailSent", "name", "productId", "shop" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_productId_key" ON "Product"("productId");
PRAGMA foreign_key_check("Variant");
PRAGMA foreign_key_check("Product");
PRAGMA foreign_keys=ON;
