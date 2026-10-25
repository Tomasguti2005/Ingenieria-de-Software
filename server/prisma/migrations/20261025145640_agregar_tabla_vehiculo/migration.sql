-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patente" TEXT NOT NULL,
    "modelo" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_patente_key" ON "Vehiculo"("patente");
