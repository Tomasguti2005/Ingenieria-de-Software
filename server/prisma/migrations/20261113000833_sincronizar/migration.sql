-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ruta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "transportistaId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ruta_transportistaId_fkey" FOREIGN KEY ("transportistaId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ruta" ("createdAt", "id", "nombre", "transportistaId") SELECT "createdAt", "id", "nombre", "transportistaId" FROM "Ruta";
DROP TABLE "Ruta";
ALTER TABLE "new_Ruta" RENAME TO "Ruta";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
