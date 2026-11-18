-- Unifica MERCADO_PAGO dentro de TRANSFERENCIA (son el mismo método de pago).
-- En SQLite los enums de Prisma se guardan como TEXT, por lo que solo hace falta migrar los datos.
UPDATE "Pedido" SET "metodoPagoCobrado" = 'TRANSFERENCIA' WHERE "metodoPagoCobrado" = 'MERCADO_PAGO';
