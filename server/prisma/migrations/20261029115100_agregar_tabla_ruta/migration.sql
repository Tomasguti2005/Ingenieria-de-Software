-- CreateTable
CREATE TABLE "Ruta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "transportistaId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ruta_transportistaId_fkey" FOREIGN KEY ("transportistaId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- AlterTable: Agregar columna rutaId directamente a la tabla existente Pedido
ALTER TABLE "Pedido" ADD COLUMN "rutaId" INTEGER CONSTRAINT "Pedido_rutaId_fkey" REFERENCES "Ruta" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
