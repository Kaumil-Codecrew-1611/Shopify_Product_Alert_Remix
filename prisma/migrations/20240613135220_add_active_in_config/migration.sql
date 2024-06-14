-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailConfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "threshold" INTEGER NOT NULL DEFAULT 4,
    "frequency" INTEGER NOT NULL DEFAULT 5,
    "frequencyUnit" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_EmailConfiguration" ("email", "frequency", "frequencyUnit", "id", "shop", "threshold") SELECT "email", "frequency", "frequencyUnit", "id", "shop", "threshold" FROM "EmailConfiguration";
DROP TABLE "EmailConfiguration";
ALTER TABLE "new_EmailConfiguration" RENAME TO "EmailConfiguration";
CREATE UNIQUE INDEX "EmailConfiguration_shop_key" ON "EmailConfiguration"("shop");
CREATE UNIQUE INDEX "EmailConfiguration_email_key" ON "EmailConfiguration"("email");
PRAGMA foreign_key_check("EmailConfiguration");
PRAGMA foreign_keys=ON;
