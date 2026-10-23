// prisma.js — Instancia única de Prisma Client.
// Importar desde aquí para evitar múltiples instancias en desarrollo.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
