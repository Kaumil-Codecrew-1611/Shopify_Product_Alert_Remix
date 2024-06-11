/*
  Warnings:

  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Variant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Product_productId_key";

-- DropIndex
DROP INDEX "Variant_variantId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Product";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Variant";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailConfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "threshold" INTEGER NOT NULL DEFAULT 4,
    "frequency" INTEGER NOT NULL DEFAULT 5,
    "shop" TEXT NOT NULL,
    "email" TEXT NOT NULL
);
INSERT INTO "new_EmailConfiguration" ("email", "id", "shop", "threshold") SELECT "email", "id", "shop", "threshold" FROM "EmailConfiguration";
DROP TABLE "EmailConfiguration";
ALTER TABLE "new_EmailConfiguration" RENAME TO "EmailConfiguration";
CREATE UNIQUE INDEX "EmailConfiguration_shop_key" ON "EmailConfiguration"("shop");
CREATE UNIQUE INDEX "EmailConfiguration_email_key" ON "EmailConfiguration"("email");
PRAGMA foreign_key_check("EmailConfiguration");
PRAGMA foreign_keys=ON;
