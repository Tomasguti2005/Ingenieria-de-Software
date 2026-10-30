// prisma.js — Instancia única de Prisma Client.
// Importar desde aquí para evitar múltiples instancias en desarrollo.

const path = require('path');
const { PrismaClient } = require('@prisma/client');

const dbPath = path.resolve(__dirname, '../../prisma/dev.db').replace(/\\/g, '/');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
});

module.exports = prisma;
