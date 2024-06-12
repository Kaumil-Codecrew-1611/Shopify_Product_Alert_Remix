-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailConfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "threshold" INTEGER NOT NULL DEFAULT 4,
    "frequency" INTEGER NOT NULL DEFAULT 5,
    "frequencyUnit" TEXT NOT NULL DEFAULT 'minute',
    "shop" TEXT NOT NULL,
    "email" TEXT NOT NULL
);
INSERT INTO "new_EmailConfiguration" ("email", "frequency", "id", "shop", "threshold") SELECT "email", "frequency", "id", "shop", "threshold" FROM "EmailConfiguration";
DROP TABLE "EmailConfiguration";
ALTER TABLE "new_EmailConfiguration" RENAME TO "EmailConfiguration";
CREATE UNIQUE INDEX "EmailConfiguration_shop_key" ON "EmailConfiguration"("shop");
CREATE UNIQUE INDEX "EmailConfiguration_email_key" ON "EmailConfiguration"("email");
PRAGMA foreign_key_check("EmailConfiguration");
PRAGMA foreign_keys=ON;
