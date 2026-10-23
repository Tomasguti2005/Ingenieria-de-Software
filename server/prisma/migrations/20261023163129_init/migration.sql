-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'REPARTIDOR',
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "vehiculo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pedido" (
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
    "ordenEntrega" INTEGER,
    "metodoPagoCobrado" TEXT,
    "montoCobrado" REAL,
    "urlComprobante" TEXT,
    "motivoFallo" TEXT,
    "pedidoOriginalId" INTEGER,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEntrega" DATETIME,
    CONSTRAINT "Pedido_repartidorId_fkey" FOREIGN KEY ("repartidorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_codigoSeguimiento_key" ON "Pedido"("codigoSeguimiento");
