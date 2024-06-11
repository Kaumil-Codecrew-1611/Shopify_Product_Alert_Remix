/*
  Warnings:

  - You are about to alter the column `threshold` on the `EmailConfiguration` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailConfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "threshold" INTEGER NOT NULL DEFAULT 4,
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
