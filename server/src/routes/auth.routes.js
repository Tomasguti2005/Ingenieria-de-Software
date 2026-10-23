// auth.routes.js — Rutas de autenticación.
// POST /api/auth/admin/login  → Solo acepta rol ADMIN
// POST /api/auth/mobile/login → Solo acepta rol REPARTIDOR + estado ACTIVO

const { Router } = require('express');

const router = Router();

// TODO: Conectar con auth.controller.js en Fase 1

module.exports = router;
