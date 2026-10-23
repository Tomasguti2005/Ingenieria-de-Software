// admin/index.js — Rutas del panel de administración.
// Prefijo: /api/admin/...
// Requiere: auth.middleware + roles.middleware (solo ADMIN)

const { Router } = require('express');

const router = Router();

// TODO: Montar sub-rutas de pedidos, usuarios, rendición, reportes

module.exports = router;
