-- CreateTable
CREATE TABLE "Ruta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "transportistaId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ruta_transportistaId_fkey" FOREIGN KEY ("transportistaId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pedido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigoSeguimiento" TEXT NOT NULL,
    "direccionOrigen" TEXT NOT NULL,
    "direccionDestino" TEXT NOT NULL,
    "destinatarioNombre" TEXT NOT NULL,
    "destinatarioTelefono" TEXT NOT NULL,
    "descripcionProductos" TEXT NOT NULL,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'REGISTRADO',
    "repartidorId" INTEGER,
    "rutaId" INTEGER,
    "ordenEntrega" INTEGER,
    "metodoPagoCobrado" TEXT,
    "montoCobrado" REAL,
    "urlComprobante" TEXT,
    "motivoFallo" TEXT,
    "pedidoOriginalId" INTEGER,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEntrega" DATETIME,
    CONSTRAINT "Pedido_repartidorId_fkey" FOREIGN KEY ("repartidorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pedido_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pedido" ("codigoSeguimiento", "descripcionProductos", "destinatarioNombre", "destinatarioTelefono", "direccionDestino", "direccionOrigen", "estado", "fechaCreacion", "fechaEntrega", "id", "metodoPagoCobrado", "montoCobrado", "motivoFallo", "notas", "ordenEntrega", "pedidoOriginalId", "repartidorId", "urlComprobante") SELECT "codigoSeguimiento", "descripcionProductos", "destinatarioNombre", "destinatarioTelefono", "direccionDestino", "direccionOrigen", "estado", "fechaCreacion", "fechaEntrega", "id", "metodoPagoCobrado", "montoCobrado", "motivoFallo", "notas", "ordenEntrega", "pedidoOriginalId", "repartidorId", "urlComprobante" FROM "Pedido";
DROP TABLE "Pedido";
ALTER TABLE "new_Pedido" RENAME TO "Pedido";
CREATE UNIQUE INDEX "Pedido_codigoSeguimiento_key" ON "Pedido"("codigoSeguimiento");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

